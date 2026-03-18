-- pobBridge.lua
-- JSON-RPC bridge over stdin/stdout for PoB Analysis desktop app.
-- Loads HeadlessWrapper.lua which initializes PoB, then enters a command loop.

-- Debug: print immediately so we know the script started
io.stderr:write("[pobBridge] Script starting...\n")
io.stderr:flush()

-- ── JSON encode/decode ──────────────────────────────────────────────────────
-- Use the dkjson library bundled with PoB's runtime
-- Match both Unix (/) and Windows (\) path separators
local scriptDir = (debug.getinfo(1, "S").source or "@"):match("^@(.+[/\\])") or "./"
-- Normalize to forward slashes for consistency
scriptDir = scriptDir:gsub("\\", "/")

io.stderr:write("[pobBridge] scriptDir=" .. scriptDir .. "\n")
io.stderr:flush()

-- Try to find the runtime/lua directory (pob-runtime sibling or runtime sibling)
local runtimeLuaDir = nil
local candidates = {
  scriptDir .. "../pob-runtime/lua/",  -- bundled in our app
  scriptDir .. "../runtime/lua/",      -- stock PoB repo layout
}
for _, dir in ipairs(candidates) do
  local f = io.open(dir .. "xml.lua", "r")
  if f then
    f:close()
    runtimeLuaDir = dir
    break
  end
end
if not runtimeLuaDir then
  runtimeLuaDir = scriptDir .. "../runtime/lua/"
end
io.stderr:write("[pobBridge] runtimeLuaDir=" .. tostring(runtimeLuaDir) .. "\n")
io.stderr:flush()

-- Prepend runtime lua dir to package.path so modules like xml.lua, sha1 are found
package.path = runtimeLuaDir .. "?.lua;" ..
               runtimeLuaDir .. "?/init.lua;" ..
               package.path

-- Try to load dkjson from runtime
local ok, json = pcall(dofile, runtimeLuaDir .. "dkjson.lua")
if not ok then
  -- Fallback: minimal inline JSON encoder/decoder
  json = {}
  function json.encode(v)
    if type(v) == "nil" then return "null"
    elseif type(v) == "boolean" then return tostring(v)
    elseif type(v) == "number" then
      if v ~= v then return "null" end  -- NaN
      if v == math.huge or v == -math.huge then return "null" end
      return tostring(v)
    elseif type(v) == "string" then
      return '"' .. v:gsub('\\','\\\\'):gsub('"','\\"'):gsub('\n','\\n'):gsub('\r','\\r'):gsub('\t','\\t') .. '"'
    elseif type(v) == "table" then
      local isArr = #v > 0
      if isArr then
        local parts = {}
        for _, val in ipairs(v) do parts[#parts+1] = json.encode(val) end
        return '[' .. table.concat(parts, ',') .. ']'
      else
        local parts = {}
        for k, val in pairs(v) do
          if type(k) == "string" then
            parts[#parts+1] = '"' .. k .. '":' .. json.encode(val)
          end
        end
        return '{' .. table.concat(parts, ',') .. '}'
      end
    end
    return "null"
  end
  function json.decode(s)
    -- minimal: use loadstring trick for simple cases
    local f, err = load("return " .. s:gsub('null','nil'))
    if f then
      local ok2, val = pcall(f)
      if ok2 then return val end
    end
    return nil, "decode failed"
  end
end

-- ── Response helpers ─────────────────────────────────────────────────────────
local function send(t)
  io.write(json.encode(t) .. "\n")
  io.flush()
end

local function ok_resp(extra)
  local r = { ok = true }
  if extra then for k,v in pairs(extra) do r[k] = v end end
  send(r)
end

local function err_resp(msg)
  send({ ok = false, error = tostring(msg) })
end

-- ── Stubs needed BEFORE HeadlessWrapper loads (Launch.lua needs these) ────────
function GetVirtualScreenSize() return 1920, 1080 end
function GetCurrentWindowSize() return 1920, 1080 end
function GetContentScale() return 1 end
function GetTime() return os.clock() * 1000 end
function GetScriptPath() return scriptDir:gsub("/$", "") end
function GetRuntimePath() return runtimeLuaDir:gsub("/lua/$", "/") or scriptDir end
function GetUserPath() return scriptDir end

-- ── Inflate/Deflate BEFORE HeadlessWrapper (needed during Launch.lua init) ────
-- HeadlessWrapper stubs these as no-ops but Launch.lua loads Timeless Jewel data
-- which needs real decompression. Define them now so they work during init.
local ffi = require("ffi")
ffi.cdef[[
  unsigned long compressBound(unsigned long sourceLen);
  int compress(uint8_t *dest, unsigned long *destLen, const uint8_t *source, unsigned long sourceLen);
  int uncompress(uint8_t *dest, unsigned long *destLen, const uint8_t *source, unsigned long sourceLen);
]]
-- Try loading zlib with detailed error logging
local function tryZlib(path)
  local ok, lib = pcall(ffi.load, path)
  io.stderr:write("[pobBridge] zlib try '" .. path .. "': " .. tostring(ok) .. (ok and "" or (" -> " .. tostring(lib):sub(1,80))) .. "\n")
  return ok, ok and lib or nil
end
local zlibOk, _zlib
zlibOk, _zlib = tryZlib("z")
if not zlibOk then zlibOk, _zlib = tryZlib("zlib1") end
if not zlibOk then zlibOk, _zlib = tryZlib("./zlib1.dll") end
if not zlibOk then zlibOk, _zlib = tryZlib(scriptDir .. "zlib1.dll") end
if not zlibOk then zlibOk, _zlib = tryZlib((scriptDir .. "zlib1.dll"):gsub("/", "\\")) end
if not zlibOk then zlibOk, _zlib = tryZlib(scriptDir .. "../luajit/zlib1.dll") end
if not zlibOk then zlibOk, _zlib = tryZlib((scriptDir .. "../luajit/zlib1.dll"):gsub("/", "\\")) end
io.stderr:flush()
-- pcall returns (false, error_string) on failure — _zlib could be a string, not a lib
if not zlibOk then _zlib = nil end
io.stderr:write("[pobBridge] zlib loaded: " .. tostring(zlibOk) .. " _zlib=" .. tostring(_zlib) .. "\n")
io.stderr:flush()

if _zlib then
  function Inflate(data)
    if not data or #data == 0 then return "" end
    local srcLen = #data
    local src = ffi.cast("const uint8_t*", data)
    for mult = 10, 100, 10 do
      local destLen = ffi.new("unsigned long[1]", srcLen * mult)
      local dest = ffi.new("uint8_t[?]", destLen[0])
      local ret = _zlib.uncompress(dest, destLen, src, srcLen)
      if ret == 0 then return ffi.string(dest, destLen[0]) end
      if ret ~= -5 then return nil end
    end
    return nil
  end
  function Deflate(data)
    if not data or #data == 0 then return "" end
    local srcLen = #data
    local src = ffi.cast("const uint8_t*", data)
    local bound = _zlib.compressBound(srcLen)
    local destLen = ffi.new("unsigned long[1]", bound)
    local dest = ffi.new("uint8_t[?]", bound)
    local ret = _zlib.compress(dest, destLen, src, srcLen)
    if ret == 0 then return ffi.string(dest, destLen[0]) end
    return nil
  end
  io.stderr:write("[pobBridge] Inflate/Deflate ready (pre-HeadlessWrapper)\n")
  io.stderr:flush()
else
  io.stderr:write("[pobBridge] WARNING: zlib not found, Inflate/Deflate will be stubs\n")
  io.stderr:flush()
end

-- ── Load HeadlessWrapper (initializes PoB) ───────────────────────────────────
local hwPath = scriptDir .. "HeadlessWrapper.lua"
io.stderr:write("[pobBridge] Loading HeadlessWrapper from: " .. hwPath .. "\n")
io.stderr:write("[pobBridge] HeadlessWrapper exists: " .. tostring(io.open(hwPath, "r") ~= nil) .. "\n")
io.stderr:write("[pobBridge] CWD test - Launch.lua exists: " .. tostring(io.open("Launch.lua", "r") ~= nil) .. "\n")
io.stderr:flush()
local hwOk, hwErr = pcall(dofile, hwPath)
if not hwOk then
  io.stderr:write("[pobBridge] HeadlessWrapper FAILED: " .. tostring(hwErr) .. "\n")
  io.stderr:flush()
  send({ ok = false, error = "Failed to load HeadlessWrapper: " .. tostring(hwErr) })
  return
end

-- ── Re-override HeadlessWrapper stubs (it redefines them as no-ops) ──────────
function GetScriptPath() return scriptDir:gsub("/$", "") end
function GetRuntimePath() return runtimeLuaDir:gsub("/lua/$", "/") or scriptDir end
function GetUserPath() return scriptDir end
-- Re-override Inflate/Deflate (HeadlessWrapper stubs them again)
if _zlib then
  function Inflate(data)
    if not data or #data == 0 then return "" end
    local srcLen = #data
    local src = ffi.cast("const uint8_t*", data)
    for mult = 10, 100, 10 do
      local destLen = ffi.new("unsigned long[1]", srcLen * mult)
      local dest = ffi.new("uint8_t[?]", destLen[0])
      local ret = _zlib.uncompress(dest, destLen, src, srcLen)
      if ret == 0 then return ffi.string(dest, destLen[0]) end
    if ret ~= -5 then return nil end
  end
  return nil
end

  function Deflate(data)
    if not data or #data == 0 then return "" end
    local srcLen = #data
    local src = ffi.cast("const uint8_t*", data)
    local bound = _zlib.compressBound(srcLen)
    local destLen = ffi.new("unsigned long[1]", bound)
    local dest = ffi.new("uint8_t[?]", bound)
    local ret = _zlib.compress(dest, destLen, src, srcLen)
    if ret == 0 then return ffi.string(dest, destLen[0]) end
    return nil
  end
end -- if _zlib

-- Signal readiness
send({ ready = true })

-- ── Helper: extract a numeric stat from build output ─────────────────────────
local function getStat(statName)
  if not build then return nil end
  -- Stats are in build.calcsTab.mainOutput (not build.calcs)
  local ct = build.calcsTab
  if not ct then return nil end
  local stat = ct.mainOutput and ct.mainOutput[statName]
  if stat and type(stat) == "number" then return stat end
  -- Also try env.player.output
  if ct.mainEnv and ct.mainEnv.player and ct.mainEnv.player.output then
    stat = ct.mainEnv.player.output[statName]
    if stat and type(stat) == "number" then return stat end
  end
  return nil
end

local function recalc()
  if build then
    runCallback("OnFrame")
  end
end

-- ── Main stat names to always fetch ──────────────────────────────────────────
local CORE_STATS = {
  "FullDPS","TotalDPS","CombinedDPS",
  "TotalDot","TotalDotDPS",
  "Life","LifeUnreserved","EnergyShield","Mana","ManaUnreserved",
  "Armour","Evasion","Ward","BlockChance","SpellBlockChance",
  "CritChance","CritMultiplier","HitChance",
  "Speed","AttackSpeed","CastSpeed",
  "TotalEHP","PhysicalMaximumHitTaken","FireMaximumHitTaken",
  "ColdMaximumHitTaken","LightningMaximumHitTaken","ChaosMaximumHitTaken",
  "PhysicalDamageReduction","SpellSuppressionChance",
  "MeleeEvadeChance","ProjectileEvadeChance",
  "LifeRegenRecovery","LifeLeechGainRate",
  "FireResist","ColdResist","LightningResist","ChaosResist",
}

local function collectStats(fields)
  local out = {}
  local list = fields or CORE_STATS
  for _, name in ipairs(list) do
    local v = getStat(name)
    if v then out[name] = v end
  end
  -- Also grab main skill name from calcsTab env
  if build and build.calcsTab and build.calcsTab.mainEnv then
    local env = build.calcsTab.mainEnv
    if env.player and env.player.mainSkill then
      local ms = env.player.mainSkill
      out.SkillName = ms.activeEffect and ms.activeEffect.grantedEffect and ms.activeEffect.grantedEffect.name or ""
    end
  end
  return out
end

-- ── Serialize skills ──────────────────────────────────────────────────────────
local function serializeSocketGroups(sgl)
  local groups = {}
  if sgl then
    for gi, socketGroup in ipairs(sgl) do
        local group = {
          label = socketGroup.label or "",
          slot = socketGroup.slot or "",
          enabled = socketGroup.enabled ~= false,
          includeInFullDPS = socketGroup.includeInFullDPS or false,
          mainActiveSkill = socketGroup.mainActiveSkill or 1,
          gems = {}
        }
        if socketGroup.gemList then
          for gemIdx, gem in ipairs(socketGroup.gemList) do
            local gemColor = gem.gemData and gem.gemData.grantedEffect and gem.gemData.grantedEffect.color or 0
            group.gems[gemIdx] = {
              nameSpec = gem.nameSpec or "",
              skillId = gem.skillId or "",
              level = gem.level or 1,
              quality = gem.quality or 0,
              enabled = gem.enabled ~= false,
              qualityId = gem.qualityId or "",
              color = gemColor, -- 1=str/red, 2=dex/green, 3=int/blue
              isSupport = gem.gemData and gem.gemData.grantedEffect and gem.gemData.grantedEffect.support or false,
            }
          end
        end
        groups[gi] = group
      end
  end
  return groups
end

local function serializeSkills()
  if not build or not build.skillsTab then return { skillSets = {} } end
  -- Use the ACTIVE socketGroupList (matches what calcWith modifies)
  local activeGroups = serializeSocketGroups(build.skillsTab.socketGroupList)
  local result = { skillSets = { activeGroups } }
  -- Also store all skill sets for reference
  for si, skillSet in ipairs(build.skillsTab.skillSets) do
    if skillSet.socketGroupList ~= build.skillsTab.socketGroupList then
      -- non-active sets go after index 1
    end
  end
  return result
end

-- ── Serialize items ───────────────────────────────────────────────────────────
local function serializeItems()
  if not build or not build.itemsTab then return { items = {}, slots = {} } end
  local result = { items = {}, slots = {} }

  -- Items list
  if build.itemsTab.items then
    for _, item in pairs(build.itemsTab.items) do
      if type(item) == "table" then
        result.items[#result.items+1] = {
          id = item.id or 0,
          name = item.name or "",
          rarity = item.rarity or "",
          base = item.baseName or (item.base and item.base.name) or "",
        }
      end
    end
  end

  -- Equipped slots
  local SLOTS = {"Weapon 1","Weapon 2","Helmet","Body Armour","Gloves","Boots",
                 "Amulet","Ring 1","Ring 2","Belt",
                 "Flask 1","Flask 2","Flask 3","Flask 4","Flask 5"}
  for _, slotName in ipairs(SLOTS) do
    local selItemId = 0
    if build.itemsTab.slots and build.itemsTab.slots[slotName] then
      selItemId = build.itemsTab.slots[slotName].selItemId or 0
    end
    -- Find item name
    local itemName = slotName
    if selItemId > 0 and build.itemsTab.items and build.itemsTab.items[selItemId] then
      local item = build.itemsTab.items[selItemId]
      itemName = item.name or slotName
    end
    result.slots[#result.slots+1] = { name = slotName, itemId = selItemId, itemName = itemName }
  end
  return result
end

-- ── Serialize tree ────────────────────────────────────────────────────────────
local function serializeTree()
  if not build or not build.spec then return { nodes = {}, notables = {} } end
  local nodes = {}
  local notables = {}
  for nodeId, node in pairs(build.spec.allocNodes) do
    if node then
      nodes[#nodes+1] = nodeId
      -- Include notables and keystones with their names
      if type(node) == "table" and (node.isNotable or node.isKeystone or node.type == "Notable" or node.type == "Keystone") then
        -- Get sprite coordinates from node.sprites
        local sprite = nil
        local spriteKey = (node.type == "Keystone") and "keystoneActive" or "notableActive"
        if node.sprites and node.sprites[spriteKey] then
          local sa = node.sprites[spriteKey]
          sprite = { x = sa[1] or 0, y = sa[2] or 0, w = sa.width or 37, h = sa.height or 37 }
        end
        notables[#notables+1] = {
          id = nodeId,
          name = node.dn or node.name or ("Node " .. nodeId),
          type = (node.isKeystone or node.type == "Keystone") and "keystone" or "notable",
          icon = node.icon or nil,
          sprite = sprite,
        }
      end
    end
  end
  return {
    nodes = nodes,
    notables = notables,
    classId = build.spec.curClassId,
    ascendClassId = build.spec.curAscendClassId
  }
end

-- ── Build info ────────────────────────────────────────────────────────────────
local function getBuildInfo()
  if not build then return {} end
  return {
    name = build.buildName or "Build",
    level = build.characterLevel or 1,
    className = build.spec and (build.spec.curClassName or build.spec.curClassText) or "",
    ascendClassName = build.spec and (build.spec.curAscendClassName or build.spec.curAscendText) or "",
    bandit = build.bandit or "None",
    targetVersion = build.targetVersion or "3_0",
    mainSocketGroup = build.mainSocketGroup or 1,
  }
end

-- ── Command: calc_with ────────────────────────────────────────────────────────
-- Temporarily modify something, recalc, return stats, then restore
local function calcWith(params)
  if not build then return nil, "No build loaded" end

  local restore = {}

  -- Disable a gem temporarily (try skillId, then name, then index)
  if params.disableGem then
    local groupIdx = params.disableGem.groupIdx or 0
    local skillId = params.disableGem.skillId
    local gemName = params.disableGem.gemName
    local gemIdx = params.disableGem.gemIdx
    local sgl = build.skillsTab and build.skillsTab.socketGroupList
    local group = sgl and sgl[groupIdx + 1]
    if group and group.gemList then
      local gem = nil
      -- Try skillId first (most stable)
      if skillId then
        for _, g in ipairs(group.gemList) do
          if g.skillId == skillId and g.enabled then gem = g; break end
        end
      end
      -- Try name
      if not gem and gemName then
        for _, g in ipairs(group.gemList) do
          if g.nameSpec == gemName and g.enabled then gem = g; break end
        end
      end
      -- Fallback to index
      if not gem and gemIdx then
        local g = group.gemList[gemIdx + 1]
        if g and g.enabled then gem = g end
      end
      if gem then
        local prev = gem.enabled
        gem.enabled = false
        restore[#restore+1] = function()
          gem.enabled = prev
        end
      end
    end
  end

  -- Unequip a slot temporarily (or strip weapon mods for weapons)
  if params.unequipSlot then
    local slotName = params.unequipSlot
    if build.itemsTab and build.itemsTab.slots then
      local slotControl = build.itemsTab.slots[slotName]
      if slotControl and slotControl.selItemId and slotControl.selItemId > 0 then
        local itemId = slotControl.selItemId
        local item = build.itemsTab.items[itemId]

        -- For weapons, strip explicit/implicit mods instead of unequipping
        -- so the base weapon stays equipped and skills still function
        local isWeapon = item and (item.type == "Bow" or item.type == "Wand" or item.type == "Dagger"
          or item.type == "Sword" or item.type == "Axe" or item.type == "Mace" or item.type == "Staff"
          or item.type == "Sceptre" or item.type == "Claw" or item.type == "One Handed Sword"
          or item.type == "Two Handed Sword" or item.type == "One Handed Axe" or item.type == "Two Handed Axe"
          or item.type == "One Handed Mace" or item.type == "Two Handed Mace" or item.type == "Fishing Rod"
          or (item.base and item.base.weapon))

        if isWeapon and item and item.slotModList then
          -- Save and clear all slot mod lists
          local saved = {}
          for k, v in pairs(item.slotModList) do
            saved[k] = v
            item.slotModList[k] = new("ModList")
          end
          restore[#restore+1] = function()
            for k, v in pairs(saved) do
              item.slotModList[k] = v
            end
          end
        else
          -- Non-weapon: simply unequip
          local prevId = slotControl.selItemId
          slotControl.selItemId = 0
          restore[#restore+1] = function()
            slotControl.selItemId = prevId
          end
        end
      end
    end
  end

  -- Deallocate a tree node temporarily
  if params.removeNode then
    local nodeId = params.removeNode
    if build.spec and build.spec.allocNodes[nodeId] then
      local node = build.spec.allocNodes[nodeId]
      build.spec.allocNodes[nodeId] = nil
      build.spec:BuildAllDependsAndPaths()
      restore[#restore+1] = function()
        build.spec.allocNodes[nodeId] = node
        build.spec:BuildAllDependsAndPaths()
      end
    end
  end

  -- Rebuild calc output
  build.buildFlag = true
  runCallback("OnFrame")
  build.calcsTab:BuildOutput()
  local stats = collectStats()

  -- Restore
  for _, fn in ipairs(restore) do fn() end
  build.buildFlag = true
  runCallback("OnFrame")
  build.calcsTab:BuildOutput()

  return stats, nil
end

-- ── Command loop ──────────────────────────────────────────────────────────────
for line in io.lines() do
  line = line:gsub("^%s+", ""):gsub("%s+$", "")
  if line == "" then goto continue end

  local msg, decErr = json.decode(line)
  if not msg then
    err_resp("JSON decode error: " .. tostring(decErr))
    goto continue
  end

  local action = msg.action
  local params = msg.params or {}

  if action == "ping" then
    ok_resp({ pong = true })

  elseif action == "load_build_xml" then
    local xmlText = params.xml
    local buildName = params.name or "Analysis"
    if not xmlText then
      err_resp("Missing xml param")
    else
      local loadOk, loadErr = pcall(loadBuildFromXML, xmlText, buildName)
      if loadOk then
        -- Run frames to ensure full initialization
        for i = 1, 5 do
          runCallback("OnFrame")
        end
        -- Ensure active tree spec is properly set (may not happen during deferred loading)
        if build.treeTab and build.treeTab.specList and #build.treeTab.specList > 0 then
          local targetSpec = build.treeTab.activeSpec or 1
          -- Clamp to available specs
          if targetSpec > #build.treeTab.specList then
            targetSpec = #build.treeTab.specList
          end
          -- If the target spec has no nodes (load error), find the best working one
          local spec = build.treeTab.specList[targetSpec]
          local nodeCount = 0
          if spec then for _ in pairs(spec.allocNodes) do nodeCount = nodeCount + 1 end end
          if nodeCount <= 1 then
            -- Find the spec with the most nodes
            local bestIdx, bestCount = 1, 0
            for i, s in ipairs(build.treeTab.specList) do
              local c = 0
              for _ in pairs(s.allocNodes) do c = c + 1 end
              if c > bestCount then bestIdx, bestCount = i, c end
            end
            targetSpec = bestIdx
          end
          build.treeTab:SetActiveSpec(targetSpec)
          for i = 1, 5 do
            runCallback("OnFrame")
          end
          -- Rebuild output with proper tree
          build.calcsTab:BuildOutput()
        end
        -- Collect diagnostic info
        local diag = {
          loaded = true,
          _buildExists = build ~= nil,
          _hasCalcsTab = build and build.calcsTab ~= nil,
          _hasSpec = build and build.spec ~= nil,
          _hasSkills = build and build.skillsTab ~= nil,
          _hasItems = build and build.itemsTab ~= nil,
          _level = build and build.characterLevel,
          _xmlLen = xmlText and #xmlText or 0,
        }
        -- Check if calcsTab has output
        if build and build.calcsTab then
          diag._hasCalcsTab = true
          diag._hasMainOutput = build.calcsTab.mainOutput ~= nil
          diag._hasMainEnv = build.calcsTab.mainEnv ~= nil
          if build.calcsTab.mainOutput then
            diag._sampleDPS = build.calcsTab.mainOutput.TotalDPS
            diag._sampleLife = build.calcsTab.mainOutput.Life
          end
        end
        ok_resp(diag)
      else
        err_resp("loadBuildFromXML failed: " .. tostring(loadErr))
      end
    end

  elseif action == "get_build_info" then
    ok_resp(getBuildInfo())

  elseif action == "get_stats" then
    local stats = collectStats(params.fields)
    ok_resp(stats)

  elseif action == "get_skills" then
    ok_resp(serializeSkills())

  elseif action == "get_items" then
    ok_resp(serializeItems())

  elseif action == "get_tree" then
    ok_resp(serializeTree())

  elseif action == "get_spec_list" then
    local specs = {}
    if build and build.treeTab and build.treeTab.specList then
      for i, spec in ipairs(build.treeTab.specList) do
        local nodeCount = 0
        for _ in pairs(spec.allocNodes) do nodeCount = nodeCount + 1 end
        specs[#specs+1] = {
          index = i,
          title = spec.title or ("Spec " .. i),
          classId = spec.curClassId,
          ascendClassId = spec.curAscendClassId,
          nodeCount = nodeCount,
          active = (build.treeTab.activeSpec == i),
        }
      end
    end
    ok_resp({ specs = specs, activeSpec = build.treeTab and build.treeTab.activeSpec or 1 })

  elseif action == "set_active_spec" then
    local specIdx = tonumber(params.index)
    if not specIdx or not build or not build.treeTab then
      err_resp("Invalid spec index or no build loaded")
    elseif specIdx < 1 or specIdx > #build.treeTab.specList then
      err_resp("Spec index out of range (1-" .. #build.treeTab.specList .. ")")
    else
      build.treeTab:SetActiveSpec(specIdx)
      for i = 1, 5 do runCallback("OnFrame") end
      build.calcsTab:BuildOutput()
      ok_resp(collectStats())
    end

  elseif action == "get_skill_set_list" then
    local sets = {}
    if build and build.skillsTab and build.skillsTab.skillSets then
      for i, ss in ipairs(build.skillsTab.skillSets) do
        local gemCount = 0
        if ss.socketGroupList then
          for _, sg in ipairs(ss.socketGroupList) do
            gemCount = gemCount + (sg.gemList and #sg.gemList or 0)
          end
        end
        sets[#sets+1] = {
          index = i,
          title = ss.title or ("Skill Set " .. i),
          groupCount = ss.socketGroupList and #ss.socketGroupList or 0,
          gemCount = gemCount,
        }
      end
    end
    -- Figure out active skill set index
    local activeIdx = 1
    if build and build.skillsTab and build.skillsTab.socketGroupList then
      for i, ss in ipairs(build.skillsTab.skillSets) do
        if ss.socketGroupList == build.skillsTab.socketGroupList then
          activeIdx = i
          break
        end
      end
    end
    ok_resp({ skillSets = sets, activeSkillSet = activeIdx })

  elseif action == "get_item_set_list" then
    local sets = {}
    if build and build.itemsTab and build.itemsTab.itemSets then
      for i, is in ipairs(build.itemsTab.itemSets) do
        sets[#sets+1] = {
          index = i,
          id = is.id,
          title = is.title or ("Item Set " .. i),
        }
      end
    end
    ok_resp({ itemSets = sets, activeItemSetId = build.itemsTab and build.itemsTab.activeItemSetId or 1 })

  elseif action == "set_active_item_set" then
    local setId = tonumber(params.id)
    if not setId or not build or not build.itemsTab then
      err_resp("Invalid item set id or no build loaded")
    else
      build.itemsTab:SetActiveItemSet(setId)
      for i = 1, 5 do runCallback("OnFrame") end
      build.calcsTab:BuildOutput()
      ok_resp(collectStats())
    end

  elseif action == "get_tooltip" then
    local result = { lines = {} }
    if params.type == "gem" then
      local sgl = build.skillsTab and build.skillsTab.socketGroupList
      local group = sgl and sgl[(params.groupIdx or 0) + 1]
      local gem = nil
      if group and group.gemList then
        if params.skillId then
          for _, g in ipairs(group.gemList) do if g.skillId == params.skillId then gem = g; break end end
        elseif params.gemName then
          for _, g in ipairs(group.gemList) do if g.nameSpec == params.gemName then gem = g; break end end
        end
      end
      if gem then
        result.name = gem.nameSpec or ""
        result.level = gem.level
        result.quality = gem.quality
        if gem.gemData and gem.gemData.grantedEffect then
          local ge = gem.gemData.grantedEffect
          result.description = ge.description or ""
          result.isSupport = ge.support or false
          result.color = ge.color or 0
          -- Mana multiplier
          if ge.levels and ge.levels[gem.level] then
            local lvl = ge.levels[gem.level]
            if lvl.manaMultiplier then
              result.lines[#result.lines+1] = "Mana Multiplier: " .. (100 + lvl.manaMultiplier) .. "%"
            end
            if lvl.levelRequirement then
              result.lines[#result.lines+1] = "Requires Level " .. lvl.levelRequirement
            end
          end
          -- Base mods (the actual gem effects)
          if ge.baseMods then
            for _, mod in ipairs(ge.baseMods) do
              if mod[1] and type(mod[1]) == "table" and mod[1][1] then
                -- mod format varies, try to get description
                local desc = tostring(mod[1][1])
                if desc and desc ~= "" then result.lines[#result.lines+1] = desc end
              end
            end
          end
          -- Gem tags
          if gem.gemData.tagString then
            result.lines[#result.lines+1] = gem.gemData.tagString
          end
          -- Attribute requirements
          local reqs = {}
          if gem.gemData.reqStr and gem.gemData.reqStr > 0 then reqs[#reqs+1] = gem.gemData.reqStr .. " Str" end
          if gem.gemData.reqDex and gem.gemData.reqDex > 0 then reqs[#reqs+1] = gem.gemData.reqDex .. " Dex" end
          if gem.gemData.reqInt and gem.gemData.reqInt > 0 then reqs[#reqs+1] = gem.gemData.reqInt .. " Int" end
          if #reqs > 0 then result.lines[#result.lines+1] = "Requires " .. table.concat(reqs, ", ") end
        end
      end
    elseif params.type == "item" then
      local slotName = params.slot
      local itemName = params.itemName
      -- Find item by slot or by name
      local item = nil
      if slotName and build.itemsTab and build.itemsTab.slots and build.itemsTab.slots[slotName] then
        local sc = build.itemsTab.slots[slotName]
        if sc.selItemId and sc.selItemId > 0 then
          item = build.itemsTab.items[sc.selItemId]
        end
      end
      if not item and itemName and build.itemsTab and build.itemsTab.items then
        for _, it in pairs(build.itemsTab.items) do
          if type(it) == "table" and it.name and it.name:find(itemName, 1, true) then
            item = it; break
          end
        end
      end
      if item then
            result.name = item.name or ""
            result.rarity = item.rarity or ""
            result.base = item.baseName or ""
            result.variant = item.variant
            if item.variantList and item.variant then
              result.variantName = item.variantList[item.variant]
            end
            -- Use rawLines — filter by active variant and skip metadata
            local activeVariant = item.variant
            if item.rawLines then
              for _, rl in ipairs(item.rawLines) do
                local line = tostring(rl)
                -- Skip metadata/header lines
                if line:match("^Rarity:") or line:match("^Item Level:") or line:match("^Quality:")
                  or line:match("^Sockets:") or line:match("^LevelReq:") or line:match("^Implicits:")
                  or line:match("^Unique ID:") or line:match("Percentile:")
                  or line:match("^Variant:") or line:match("^Selected Variant:")
                  or line:match("^Selected Alt Variant:") or line:match("^Has Alt Variant:")
                  or line:match("^Has Variant:") or line:match("^League:")
                  or line:match("^Source:") or line:match("^Prefix:")
                  or line:match("^Suffix:") or line:match("^Crafted:")
                  or line:match("^Unreleased:") or line:match("^Note:")
                  or line:match("^Shaper Item") or line:match("^Elder Item")
                  or line:match("^Crusader Item") or line:match("^Hunter Item")
                  or line:match("^Redeemer Item") or line:match("^Warlord Item")
                  or line:match("^Fractured Item") or line:match("^Synthesised Item")
                  or line == item.title or line == item.baseName or line == "" then
                  goto skipline
                end
                -- Check variant filter: if line has {variant:X,Y}, only include if activeVariant matches
                local variantTag = line:match("{variant:([^}]+)}")
                if variantTag and activeVariant then
                  local matches = false
                  for num in variantTag:gmatch("%d+") do
                    if tonumber(num) == activeVariant then matches = true; break end
                  end
                  if not matches then goto skipline end
                end
                -- Include the line
                result.lines[#result.lines+1] = line
                ::skipline::
              end
            end
      end
    elseif params.type == "notable" then
      local nodeId = tonumber(params.nodeId)
      if nodeId and build.spec and build.spec.allocNodes[nodeId] then
        local node = build.spec.allocNodes[nodeId]
        result.name = node.dn or ""
        result.nodeType = node.type or ""
        if node.sd then
          for _, line in ipairs(node.sd) do
            if line and line ~= "" then result.lines[#result.lines+1] = line end
          end
        end
      end
    end
    ok_resp(result)

  elseif action == "set_active_skill_set" then
    local setIdx = tonumber(params.index)
    if not setIdx or not build or not build.skillsTab then
      err_resp("Invalid skill set index or no build loaded")
    elseif setIdx < 1 or setIdx > #build.skillsTab.skillSets then
      err_resp("Skill set index out of range")
    else
      build.skillsTab:SetActiveSkillSet(setIdx)
      for i = 1, 3 do runCallback("OnFrame") end
      build.calcsTab:BuildOutput()
      ok_resp(collectStats())
    end

  elseif action == "batch_calc" then
    -- Fast batch: for each job, apply change → BuildOutput → collect stats → restore change
    -- Only does ONE BuildOutput per job (skip the restore rebuild)
    -- Then one final BuildOutput at the end to restore baseline
    local jobs = params.jobs
    if not jobs or not build then
      err_resp("No jobs or no build loaded")
    else
      local results = {}
      for ji, job in ipairs(jobs) do
        local restore = {}

        -- Apply the modification (same logic as calcWith but inline for speed)
        if job.disableGem then
          local groupIdx = job.disableGem.groupIdx or 0
          local skillId = job.disableGem.skillId
          local gemName = job.disableGem.gemName
          local gemIdx2 = job.disableGem.gemIdx
          local sgl = build.skillsTab and build.skillsTab.socketGroupList
          local group = sgl and sgl[groupIdx + 1]
          if group and group.gemList then
            local gem = nil
            if skillId then
              for _, g in ipairs(group.gemList) do if g.skillId == skillId and g.enabled then gem = g; break end end
            end
            if not gem and gemName then
              for _, g in ipairs(group.gemList) do if g.nameSpec == gemName and g.enabled then gem = g; break end end
            end
            if not gem and gemIdx2 then
              local g = group.gemList[gemIdx2 + 1]
              if g and g.enabled then gem = g end
            end
            if gem then
              gem.enabled = false
              restore[#restore+1] = function() gem.enabled = true end
            end
          end
        end

        if job.unequipSlot then
          local slotName = job.unequipSlot
          if build.itemsTab and build.itemsTab.slots then
            local sc = build.itemsTab.slots[slotName]
            if sc and sc.selItemId and sc.selItemId > 0 then
              local item = build.itemsTab.items[sc.selItemId]
              local isWeapon = item and (item.base and item.base.weapon)
              if isWeapon and item and item.slotModList then
                local saved = {}
                for k, v in pairs(item.slotModList) do saved[k] = v; item.slotModList[k] = new("ModList") end
                restore[#restore+1] = function() for k, v in pairs(saved) do item.slotModList[k] = v end end
              else
                local prevId = sc.selItemId
                sc.selItemId = 0
                restore[#restore+1] = function() sc.selItemId = prevId end
              end
            end
          end
        end

        if job.removeNode then
          local nodeId = job.removeNode
          if build.spec and build.spec.allocNodes[nodeId] then
            local node = build.spec.allocNodes[nodeId]
            build.spec.allocNodes[nodeId] = nil
            build.spec:BuildAllDependsAndPaths()
            restore[#restore+1] = function()
              build.spec.allocNodes[nodeId] = node
              build.spec:BuildAllDependsAndPaths()
            end
          end
        end

        -- Rebuild and collect stats (ONE BuildOutput per job)
        build.buildFlag = true
        runCallback("OnFrame")
        build.calcsTab:BuildOutput()
        local stats = collectStats()
        stats.ok = true
        results[ji] = stats

        -- Restore state (NO BuildOutput here — just undo the change)
        for _, fn in ipairs(restore) do fn() end
      end

      -- One final rebuild to restore baseline
      build.buildFlag = true
      runCallback("OnFrame")
      build.calcsTab:BuildOutput()

      ok_resp({ results = results })
    end

  elseif action == "get_danger_analysis" then
    local output = build.calcsTab.mainOutput
    local env = build.calcsTab.mainEnv
    local modDB = env and env.player and env.player.modDB
    local result = { resists = {}, maxHitTaken = {}, ailments = {}, recovery = {}, pools = {}, avoidance = {} }

    -- Resistances
    for _, elem in ipairs({"Fire", "Cold", "Lightning", "Chaos"}) do
      result.resists[elem] = {
        current = output[elem.."Resist"] or 0,
        max = output[elem.."ResistMax"] or 75,
        overcap = output[elem.."ResistOverCap"] or 0,
      }
    end
    -- Max hit survivable
    for _, dt in ipairs({"Physical", "Fire", "Cold", "Lightning", "Chaos"}) do
      result.maxHitTaken[dt] = output[dt.."MaximumHitTaken"] or 0
    end
    -- EHP
    result.ehp = { total = output["TotalEHP"] or 0 }
    -- Ailments
    for _, a in ipairs({"Ignite","Freeze","Shock","Chill","Bleed","Poison","Scorch","Brittle","Sap"}) do
      result.ailments[a] = { avoidChance = output[a.."AvoidChance"] or 0 }
    end
    result.ailments.Stun = { avoidChance = output["StunAvoidChance"] or 0 }
    result.ailments.CorruptingBlood = { avoidChance = modDB and modDB:Flag(nil, "Condition:ImmuneToCorruptingBlood") and 100 or 0 }
    -- Recovery
    for _, pool in ipairs({"Life", "EnergyShield", "Mana"}) do
      result.recovery[pool] = {
        regen = output[pool.."RegenRecovery"] or 0,
        leechRate = output[pool.."LeechGainRate"] or 0,
      }
    end
    -- Pools
    result.pools = {
      life = output["Life"] or 0, lifeUnreserved = output["LifeUnreserved"] or 0,
      energyShield = output["EnergyShield"] or 0,
      mana = output["Mana"] or 0, manaUnreserved = output["ManaUnreserved"] or 0,
      ward = output["Ward"] or 0,
    }
    -- Reduction + Avoidance
    result.physicalReduction = output["PhysicalDamageReduction"] or 0
    result.armour = output["Armour"] or 0
    result.avoidance = {
      blockChance = output["BlockChance"] or 0,
      spellBlockChance = output["SpellBlockChance"] or 0,
      suppressionChance = output["SpellSuppressionChance"] or 0,
      meleeEvadeChance = output["MeleeEvadeChance"] or 0,
      projectileEvadeChance = output["ProjectileEvadeChance"] or 0,
    }
    result.chaosInoculation = env and env.keystonesAdded and env.keystonesAdded["Chaos Inoculation"] or false
    ok_resp(result)

  elseif action == "get_synergies" then
    local env = build.calcsTab.mainEnv
    local player = env and env.player
    local output = build.calcsTab.mainOutput
    local modDB = player and player.modDB
    local result = { keystones = {}, activeSkills = {}, supports = {}, conditions = {},
                     multipliers = {}, stats = {}, ascendancy = {}, uniques = {},
                     conversionTable = {}, skillFlags = {} }

    -- Keystones from env + tree nodes
    if env and env.keystonesAdded then
      for name, _ in pairs(env.keystonesAdded) do result.keystones[#result.keystones+1] = name end
    end
    -- Also get keystones/ascendancy notables from allocated tree nodes
    if build.spec and build.spec.allocNodes then
      for _, node in pairs(build.spec.allocNodes) do
        if type(node) == "table" then
          if node.type == "Keystone" then
            result.keystones[#result.keystones+1] = node.dn or node.name or ""
          end
        end
      end
    end
    -- Ascendancy nodes are type "Notable" but from ascendancy — add them
    if build.spec and build.spec.allocNodes then
      result.ascendancyNotables = {}
      for _, node in pairs(build.spec.allocNodes) do
        if type(node) == "table" and node.ascendancyName then
          result.ascendancyNotables[#result.ascendancyNotables+1] = node.dn or ""
        end
      end
    end
    -- Active skills
    if player and player.activeSkillList then
      for _, skill in ipairs(player.activeSkillList) do
        local ae = skill.activeEffect
        if ae and ae.grantedEffect then
          result.activeSkills[#result.activeSkills+1] = {
            name = ae.grantedEffect.name or "",
            isVaal = (ae.grantedEffect.name or ""):match("^Vaal") ~= nil,
          }
        end
      end
    end
    -- Supports on main skill
    if player and player.mainSkill and player.mainSkill.effectList then
      for i, effect in ipairs(player.mainSkill.effectList) do
        if i > 1 and effect.grantedEffect then
          result.supports[#result.supports+1] = effect.grantedEffect.name or ""
        end
      end
    end
    -- Key stats from mainOutput
    local statsToCheck = {"CritChance","Life","Mana","ManaUnreserved","EnergyShield","ImpaleChance","ImpaleDPS",
      "Rage","TotalDPS","CombinedDPS","BlockChance","SpellBlockChance","Armour","Evasion",
      "FireResist","ColdResist","LightningResist","ChaosResist"}
    for _, s in ipairs(statsToCheck) do
      if output[s] then result.stats[s] = output[s] end
    end
    -- Per-element hit averages from main skill output (not top-level)
    if player and player.mainSkill and player.mainSkill.output then
      local skillOut = player.mainSkill.output
      for _, dt in ipairs({"Physical","Lightning","Cold","Fire","Chaos"}) do
        local v = skillOut[dt.."HitAverage"]
        if v and v > 0 then result.stats[dt.."HitAverage"] = v end
      end
    end
    -- Charges/multipliers from modDB
    if modDB and modDB.multipliers then
      for k, v in pairs(modDB.multipliers) do
        if type(v) == "number" and v > 0 then result.multipliers[k] = v end
      end
    end
    -- Also put charge counts in stats if from multipliers
    if result.multipliers.PowerCharge then result.stats.PowerCharges = result.multipliers.PowerCharge end
    if result.multipliers.FrenzyCharge then result.stats.FrenzyCharges = result.multipliers.FrenzyCharge end
    if result.multipliers.EnduranceCharge then result.stats.EnduranceCharges = result.multipliers.EnduranceCharge end
    -- Conditions from modDB
    if modDB and modDB.conditions then
      for k, v in pairs(modDB.conditions) do
        if v then result.conditions[#result.conditions+1] = k end
      end
    end
    -- Ascendancy
    result.ascendancy = {
      className = build.spec and (build.spec.curClassName or "") or "",
      ascendClassName = build.spec and (build.spec.curAscendClassName or "") or "",
    }
    -- Uniques
    if build.itemsTab and build.itemsTab.items then
      for _, item in pairs(build.itemsTab.items) do
        if type(item) == "table" and item.rarity == "UNIQUE" then
          result.uniques[#result.uniques+1] = { name = item.name or "", base = item.baseName or "" }
        end
      end
    end
    -- Conversion table
    if player and player.mainSkill and player.mainSkill.conversionTable then
      for dt, ct in pairs(player.mainSkill.conversionTable) do
        if ct.conversion then
          local conv = {}
          for k, v in pairs(ct.conversion) do if v > 0 then conv[k] = v end end
          local gain = {}
          if ct.gain then for k, v in pairs(ct.gain) do if v > 0 then gain[k] = v end end end
          result.conversionTable[dt] = { conversion = conv, gain = gain, mult = ct.mult }
        end
      end
    end
    -- Skill flags
    if player and player.mainSkill and player.mainSkill.skillFlags then
      for k, v in pairs(player.mainSkill.skillFlags) do
        if v then result.skillFlags[#result.skillFlags+1] = k end
      end
    end
    ok_resp(result)

  elseif action == "get_damage_breakdown" then
    local env = build.calcsTab.mainEnv
    local player = env and env.player
    local output = build.calcsTab.mainOutput
    local mainSkill = player and player.mainSkill
    local skillModList = mainSkill and mainSkill.skillModList
    local cfg = mainSkill and mainSkill.skillCfg
    local modDB = player and player.modDB

    local result = { skillName = "", damageTypes = {}, defences = {} }
    result.skillName = mainSkill and mainSkill.activeEffect and mainSkill.activeEffect.grantedEffect
      and mainSkill.activeEffect.grantedEffect.name or ""
    result.totalDps = output["TotalDPS"] or 0
    result.combinedDps = output["CombinedDPS"] or 0

    local dmgTypes = {"Physical", "Lightning", "Cold", "Fire", "Chaos"}
    for _, dt in ipairs(dmgTypes) do
      local entry = {
        baseMin = output[dt.."MinBase"] or 0,
        baseMax = output[dt.."MaxBase"] or 0,
        hitAverage = output[dt.."HitAverage"] or 0,
        critAverage = output[dt.."CritAverage"] or 0,
        dotDps = output[dt.."Dot"] or 0,
      }
      -- INC/MORE totals
      if skillModList and cfg then
        local ok1, inc = pcall(function() return skillModList:Sum("INC", cfg, dt.."Damage", "Damage") end)
        local ok2, more = pcall(function() return skillModList:More(cfg, dt.."Damage", "Damage") end)
        entry.incTotal = ok1 and inc or 0
        entry.moreTotal = ok2 and more or 1
      else
        entry.incTotal = 0
        entry.moreTotal = 1
      end
      -- Conversion
      if mainSkill and mainSkill.conversionTable and mainSkill.conversionTable[dt] then
        local ct = mainSkill.conversionTable[dt]
        entry.multRemaining = ct.mult or 1
        entry.conversion = {}
        if ct.conversion then for k, v in pairs(ct.conversion) do if v > 0 then entry.conversion[k] = v end end end
        entry.gain = {}
        if ct.gain then for k, v in pairs(ct.gain) do if v > 0 then entry.gain[k] = v end end end
      end
      result.damageTypes[dt] = entry
    end

    -- Defence breakdown
    for _, def in ipairs({"Life", "EnergyShield", "Armour", "Evasion"}) do
      local base, inc, more = 0, 0, 1
      if modDB then
        local ok1, v1 = pcall(function() return modDB:Sum("BASE", nil, def) end)
        local ok2, v2 = pcall(function() return modDB:Sum("INC", nil, def) end)
        local ok3, v3 = pcall(function() return modDB:More(nil, def) end)
        if ok1 then base = v1 end
        if ok2 then inc = v2 end
        if ok3 then more = v3 end
      end
      result.defences[def] = { base = base, inc = inc, more = more, total = output[def] or 0 }
    end

    ok_resp(result)

  elseif action == "calc_with" then
    local stats, calcErr = calcWith(params)
    if calcErr then
      err_resp(calcErr)
    else
      ok_resp(stats)
    end

  elseif action == "quit" then
    ok_resp({ bye = true })
    break

  else
    err_resp("Unknown action: " .. tostring(action))
  end

  ::continue::
end
