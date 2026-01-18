require("constants")
local Tilemap = require("tilemap")
local Player = require("player")
local Base = require("base")
local AI = require("ai")

local game = {
    map = nil,
    player = nil,
    aiOpponent = nil,
    baseLeft = nil,
    baseRight = nil,
    camera = { x = 0, y = 0 },
    miningRange = 3 * TILE_SIZE,
    selectedTile = TILE_DIRT
}

local TILE_NAMES = {
    [TILE_DIRT] = "Dirt",
    [TILE_STONE] = "Stone",
    [TILE_ORE_COPPER] = "Copper",
    [TILE_ORE_SILVER] = "Silver",
    [TILE_ORE_GOLD] = "Gold",
}

function love.load()
    love.graphics.setDefaultFilter("nearest", "nearest")

    game.map = Tilemap.new(MAP_WIDTH, MAP_HEIGHT)
    game.map:generate()

    -- Find spawn position for player (on surface, left side)
    local spawnX = 3 * TILE_SIZE
    local spawnY = 0
    for y = 1, MAP_HEIGHT do
        if game.map:isSolid(3, y) then
            spawnY = (y - 2) * TILE_SIZE
            break
        end
    end

    game.player = Player.new(spawnX, spawnY, TEAM_LEFT)

    -- Create bases for both teams
    local groundLevel = math.floor(MAP_HEIGHT * 0.3)
    local baseY = (groundLevel - 1) * TILE_SIZE - 96

    -- Left base (Team Left)
    local leftBaseX = 2 * TILE_SIZE
    game.baseLeft = Base.new(leftBaseX, baseY, TEAM_LEFT)

    -- Right base (Team Right)
    local rightBaseX = (MAP_WIDTH - 4) * TILE_SIZE
    game.baseRight = Base.new(rightBaseX, baseY, TEAM_RIGHT)

    -- Clear tiles under bases
    for by = groundLevel - 3, groundLevel - 1 do
        for bx = 2, 4 do
            game.map:setTile(bx, by, TILE_EMPTY)
        end
        for bx = MAP_WIDTH - 4, MAP_WIDTH - 2 do
            game.map:setTile(bx, by, TILE_EMPTY)
        end
    end

    -- Create AI opponent (Team Right)
    local aiSpawnX = (MAP_WIDTH - 5) * TILE_SIZE
    local aiSpawnY = baseY + game.baseRight.height - 32
    game.aiOpponent = AI.new(aiSpawnX, aiSpawnY, TEAM_RIGHT)
end

function isPlayerNearBase(base)
    local px, py = game.player:getCenter()
    local bx, by, bx2, by2 = base:getBounds()
    local distance = 50
    return px >= bx - distance and px <= bx2 + distance and
           py >= by - distance and py <= by2 + distance
end

function love.update(dt)
    -- Update player
    game.player:update(dt, game.map)

    -- Update AI opponent
    game.aiOpponent:update(dt, game.map, game.baseRight)

    -- Camera follows player
    local playerCenterX, playerCenterY = game.player:getCenter()
    local targetCameraX = playerCenterX - love.graphics.getWidth() / 2
    local targetCameraY = playerCenterY - love.graphics.getHeight() / 2

    -- Smooth camera
    game.camera.x = game.camera.x + (targetCameraX - game.camera.x) * 5 * dt
    game.camera.y = game.camera.y + (targetCameraY - game.camera.y) * 5 * dt

    -- Clamp camera to map bounds
    local maxX = MAP_WIDTH * TILE_SIZE - love.graphics.getWidth()
    local maxY = MAP_HEIGHT * TILE_SIZE - love.graphics.getHeight()
    game.camera.x = math.max(0, math.min(game.camera.x, maxX))
    game.camera.y = math.max(0, math.min(game.camera.y, maxY))
end

function getMouseWorldPos()
    local mx, my = love.mouse.getPosition()
    return mx + game.camera.x, my + game.camera.y
end

function isInMiningRange(worldX, worldY)
    local playerCenterX, playerCenterY = game.player:getCenter()
    local dx = worldX - playerCenterX
    local dy = worldY - playerCenterY
    return math.sqrt(dx * dx + dy * dy) <= game.miningRange
end

function love.mousepressed(x, y, button)
    local worldX, worldY = getMouseWorldPos()
    local tileX, tileY = game.map:worldToTile(worldX, worldY)

    if not isInMiningRange(worldX, worldY) then
        return
    end

    if button == 1 then
        -- Left click: Dig
        local dugTile = game.map:dig(tileX, tileY)
        if dugTile then
            game.player:addToInventory(dugTile)
        end
    elseif button == 2 then
        -- Right click: Place
        if game.player:hasInInventory(game.selectedTile) then
            if game.map:place(tileX, tileY, game.selectedTile) then
                game.player:removeFromInventory(game.selectedTile)
            end
        end
    end
end

function love.wheelmoved(x, y)
    -- Scroll to select tile type from inventory
    local tileTypes = {TILE_DIRT, TILE_STONE, TILE_ORE_COPPER, TILE_ORE_SILVER, TILE_ORE_GOLD}
    local currentIndex = 1
    for i, t in ipairs(tileTypes) do
        if t == game.selectedTile then
            currentIndex = i
            break
        end
    end

    if y > 0 then
        currentIndex = currentIndex - 1
        if currentIndex < 1 then currentIndex = #tileTypes end
    elseif y < 0 then
        currentIndex = currentIndex + 1
        if currentIndex > #tileTypes then currentIndex = 1 end
    end

    game.selectedTile = tileTypes[currentIndex]
end

function love.draw()
    -- Draw sky background
    love.graphics.setColor(0.4, 0.6, 0.9, 1)
    love.graphics.rectangle("fill", 0, 0, love.graphics.getWidth(), love.graphics.getHeight())

    -- Draw tilemap
    game.map:draw(game.camera.x, game.camera.y)

    -- Draw bases
    game.baseLeft:draw(game.camera.x, game.camera.y)
    game.baseRight:draw(game.camera.x, game.camera.y)

    -- Draw player
    game.player:draw(game.camera.x, game.camera.y)

    -- Draw AI opponent
    game.aiOpponent:draw(game.camera.x, game.camera.y)

    -- Draw mining range indicator
    local mx, my = love.mouse.getPosition()
    local worldX, worldY = getMouseWorldPos()
    local tileX, tileY = game.map:worldToTile(worldX, worldY)
    local tileWorldX, tileWorldY = game.map:tileToWorld(tileX, tileY)

    if isInMiningRange(worldX, worldY) then
        love.graphics.setColor(1, 1, 1, 0.3)
    else
        love.graphics.setColor(1, 0, 0, 0.3)
    end
    love.graphics.rectangle("line", tileWorldX - game.camera.x, tileWorldY - game.camera.y, TILE_SIZE, TILE_SIZE)

    -- Draw UI
    love.graphics.setColor(1, 1, 1, 1)
    love.graphics.print("Until the End - WASD: Move | Space: Jump | LMB: Dig | RMB: Place | Scroll: Select", 10, 10)
    love.graphics.print("FPS: " .. love.timer.getFPS(), 10, 30)
    love.graphics.print("Health: " .. game.player.health .. "/" .. game.player.maxHealth, 10, 50)

    -- Draw inventory
    love.graphics.print("Inventory:", 10, 80)
    local invY = 100
    local tileTypes = {TILE_DIRT, TILE_STONE, TILE_ORE_COPPER, TILE_ORE_SILVER, TILE_ORE_GOLD}
    for _, tileType in ipairs(tileTypes) do
        local count = game.player.inventory[tileType] or 0
        if count > 0 or tileType == game.selectedTile then
            local color = TILE_COLORS[tileType]
            love.graphics.setColor(color)
            love.graphics.rectangle("fill", 10, invY, 16, 16)

            if tileType == game.selectedTile then
                love.graphics.setColor(1, 1, 0, 1)
                love.graphics.rectangle("line", 10, invY, 16, 16)
            end

            love.graphics.setColor(1, 1, 1, 1)
            love.graphics.print(TILE_NAMES[tileType] .. ": " .. count, 32, invY)
            invY = invY + 20
        end
    end

    -- Draw selected tile indicator
    love.graphics.setColor(1, 1, 1, 1)
    love.graphics.print("Selected: " .. TILE_NAMES[game.selectedTile], 10, love.graphics.getHeight() - 25)

    -- Draw base interaction UI when near player's base
    local playerBase = game.player.team == TEAM_LEFT and game.baseLeft or game.baseRight
    if isPlayerNearBase(playerBase) then
        local baseUIX = love.graphics.getWidth() - 200
        love.graphics.setColor(0, 0, 0, 0.7)
        love.graphics.rectangle("fill", baseUIX - 10, 70, 200, 100)

        love.graphics.setColor(1, 1, 1, 1)
        love.graphics.print("=== YOUR BASE ===", baseUIX, 75)
        love.graphics.print("Level: " .. playerBase.level, baseUIX, 95)
        love.graphics.print("Resources: " .. playerBase.resources, baseUIX, 115)
        love.graphics.print("Upgrade Cost: " .. playerBase:getUpgradeCost(), baseUIX, 135)
        love.graphics.print("[E] Deposit | [U] Upgrade", baseUIX, 155)
    end
end

function love.keypressed(key)
    if key == "escape" then
        love.event.quit()
    end
    if key == "r" then
        game.map:generate()
        -- Respawn player
        local spawnX = 3 * TILE_SIZE
        local spawnY = 0
        for y = 1, MAP_HEIGHT do
            if game.map:isSolid(3, y) then
                spawnY = (y - 2) * TILE_SIZE
                break
            end
        end
        game.player.x = spawnX
        game.player.y = spawnY
        game.player.vx = 0
        game.player.vy = 0
        game.player.inventory = {}

        -- Reset AI opponent
        local groundLevel = math.floor(MAP_HEIGHT * 0.3)
        local baseY = (groundLevel - 1) * TILE_SIZE - 96
        game.aiOpponent.x = (MAP_WIDTH - 5) * TILE_SIZE
        game.aiOpponent.y = baseY + game.baseRight.height - 32
        game.aiOpponent.vx = 0
        game.aiOpponent.vy = 0
        game.aiOpponent.inventory = {}
        game.aiOpponent.state = "idle"
    end

    -- Number keys to select tile type
    local tileTypes = {TILE_DIRT, TILE_STONE, TILE_ORE_COPPER, TILE_ORE_SILVER, TILE_ORE_GOLD}
    for i = 1, 5 do
        if key == tostring(i) then
            game.selectedTile = tileTypes[i]
        end
    end

    -- Deposit resources at base (E key)
    if key == "e" then
        local playerBase = game.player.team == TEAM_LEFT and game.baseLeft or game.baseRight
        if isPlayerNearBase(playerBase) then
            -- Calculate total resource value from inventory
            local totalValue = 0
            for tileType, count in pairs(game.player.inventory) do
                totalValue = totalValue + (TILE_VALUES[tileType] or 0) * count
            end
            if totalValue > 0 then
                playerBase:depositResources(totalValue)
                game.player.inventory = {}
            end
        end
    end

    -- Upgrade base (U key)
    if key == "u" then
        local playerBase = game.player.team == TEAM_LEFT and game.baseLeft or game.baseRight
        if isPlayerNearBase(playerBase) then
            playerBase:upgrade()
        end
    end
end
