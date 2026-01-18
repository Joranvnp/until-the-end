local AI = {}
AI.__index = AI

-- AI States
local STATE_IDLE = "idle"
local STATE_MOVING = "moving"
local STATE_DIGGING = "digging"
local STATE_RETURNING = "returning"
local STATE_DEPOSITING = "depositing"

function AI.new(x, y, team)
    local self = setmetatable({}, AI)
    self.x = x
    self.y = y
    self.width = 24
    self.height = 32
    self.team = team or TEAM_RIGHT

    -- Physics
    self.vx = 0
    self.vy = 0
    self.onGround = false

    -- Stats
    self.health = 100
    self.maxHealth = 100
    self.miningForce = 5

    -- Inventory
    self.inventory = {}
    self.inventoryCapacity = 10

    -- AI State
    self.state = STATE_IDLE
    self.targetX = nil
    self.targetY = nil
    self.moveDirection = 0
    self.stateTimer = 0
    self.digCooldown = 0
    self.thinkTimer = 0

    -- Reference to base (set externally)
    self.homeBase = nil

    return self
end

function AI:getInventoryCount()
    local count = 0
    for _, amount in pairs(self.inventory) do
        count = count + amount
    end
    return count
end

function AI:addToInventory(tileType)
    self.inventory[tileType] = (self.inventory[tileType] or 0) + 1
end

function AI:getInventoryValue()
    local total = 0
    for tileType, count in pairs(self.inventory) do
        total = total + (TILE_VALUES[tileType] or 0) * count
    end
    return total
end

function AI:clearInventory()
    self.inventory = {}
end

function AI:update(dt, tilemap, base)
    self.homeBase = base
    self.stateTimer = self.stateTimer + dt
    self.thinkTimer = self.thinkTimer + dt
    self.digCooldown = math.max(0, self.digCooldown - dt)

    -- Think every 0.5 seconds
    if self.thinkTimer >= 0.5 then
        self.thinkTimer = 0
        self:think(tilemap)
    end

    -- Execute current state behavior
    self:executeBehavior(dt, tilemap)

    -- Apply physics
    self:applyPhysics(dt, tilemap)
end

function AI:think(tilemap)
    local inventoryCount = self:getInventoryCount()

    -- If inventory is full or has valuable resources, return to base
    if inventoryCount >= self.inventoryCapacity then
        self.state = STATE_RETURNING
        return
    end

    -- If near base and have resources, deposit them
    if self.homeBase and self:isNearBase() and inventoryCount > 0 then
        self.state = STATE_DEPOSITING
        return
    end

    -- Find something to dig
    if self.state == STATE_IDLE or self.state == STATE_MOVING then
        local targetTile = self:findNearestDiggableTile(tilemap)
        if targetTile then
            self.targetX = targetTile.x
            self.targetY = targetTile.y
            self.state = STATE_MOVING
        else
            -- Wander randomly
            self.state = STATE_MOVING
            self.targetX = self.x + (math.random() > 0.5 and 100 or -100)
        end
    end
end

function AI:isNearBase()
    if not self.homeBase then return false end
    local bx, by, bx2, by2 = self.homeBase:getBounds()
    local cx, cy = self:getCenter()
    local distance = 60
    return cx >= bx - distance and cx <= bx2 + distance and
           cy >= by - distance and cy <= by2 + distance
end

function AI:findNearestDiggableTile(tilemap)
    local cx, cy = self:getCenter()
    local tileX = math.floor(cx / TILE_SIZE) + 1
    local tileY = math.floor(cy / TILE_SIZE) + 1

    local searchRadius = 10
    local bestTile = nil
    local bestScore = -1

    for dy = -searchRadius, searchRadius do
        for dx = -searchRadius, searchRadius do
            local tx = tileX + dx
            local ty = tileY + dy
            local tile = tilemap:getTile(tx, ty)

            if tile ~= TILE_EMPTY and tile ~= nil then
                local worldX = (tx - 0.5) * TILE_SIZE
                local worldY = (ty - 0.5) * TILE_SIZE
                local dist = math.sqrt((worldX - cx)^2 + (worldY - cy)^2)

                -- Score based on value and distance
                local value = TILE_VALUES[tile] or 1
                local score = value / (dist + 1)

                if score > bestScore then
                    bestScore = score
                    bestTile = {x = worldX, y = worldY, tileX = tx, tileY = ty}
                end
            end
        end
    end

    return bestTile
end

function AI:executeBehavior(dt, tilemap)
    if self.state == STATE_MOVING or self.state == STATE_RETURNING then
        local targetX = self.targetX
        if self.state == STATE_RETURNING and self.homeBase then
            targetX = self.homeBase.x + self.homeBase.width / 2
        end

        if targetX then
            local cx = self:getCenter()
            local diff = targetX - cx

            if math.abs(diff) < 20 then
                self.moveDirection = 0
                if self.state == STATE_MOVING and self.targetY then
                    -- Try to dig
                    self:tryDig(tilemap)
                elseif self.state == STATE_RETURNING then
                    self.state = STATE_DEPOSITING
                end
            else
                self.moveDirection = diff > 0 and 1 or -1
            end

            -- Jump if blocked
            if self.onGround and self:isBlockedHorizontally(tilemap) then
                self.vy = -PLAYER_JUMP_FORCE
                self.onGround = false
            end
        end

    elseif self.state == STATE_DEPOSITING then
        self.moveDirection = 0
        if self.homeBase and self:isNearBase() then
            local value = self:getInventoryValue()
            if value > 0 then
                self.homeBase:depositResources(value)
                self:clearInventory()
            end
            self.state = STATE_IDLE
        else
            self.state = STATE_RETURNING
        end

    elseif self.state == STATE_DIGGING then
        self.moveDirection = 0
        self:tryDig(tilemap)
        if self.stateTimer > 1 then
            self.state = STATE_IDLE
        end

    else -- IDLE
        self.moveDirection = 0
    end
end

function AI:tryDig(tilemap)
    if self.digCooldown > 0 then return end

    local cx, cy = self:getCenter()
    local tileX = math.floor(cx / TILE_SIZE) + 1
    local tileY = math.floor(cy / TILE_SIZE) + 1

    -- Try digging in a 3x3 area around AI
    local directions = {{0, 1}, {1, 0}, {-1, 0}, {0, -1}, {1, 1}, {-1, 1}}
    for _, dir in ipairs(directions) do
        local tx = tileX + dir[1]
        local ty = tileY + dir[2]
        local tile = tilemap:getTile(tx, ty)
        if tile ~= TILE_EMPTY then
            local dugTile = tilemap:dig(tx, ty)
            if dugTile then
                self:addToInventory(dugTile)
                self.digCooldown = 0.3
                self.state = STATE_DIGGING
                self.stateTimer = 0
                return
            end
        end
    end
end

function AI:isBlockedHorizontally(tilemap)
    local cx, cy = self:getCenter()
    local checkX = cx + self.moveDirection * (self.width / 2 + 5)
    local tileX = math.floor(checkX / TILE_SIZE) + 1
    local tileY = math.floor(cy / TILE_SIZE) + 1
    return tilemap:isSolid(tileX, tileY)
end

function AI:applyPhysics(dt, tilemap)
    -- Horizontal movement
    self.vx = self.moveDirection * PLAYER_SPEED * 0.7 -- AI moves slightly slower

    -- Apply gravity
    self.vy = self.vy + GRAVITY * dt

    -- Move and handle collisions
    self:moveX(self.vx * dt, tilemap)
    self:moveY(self.vy * dt, tilemap)
end

function AI:moveX(amount, tilemap)
    self.x = self.x + amount
    if amount > 0 then
        if self:collidesWithMap(tilemap) then
            self.x = math.floor((self.x + self.width) / TILE_SIZE) * TILE_SIZE - self.width - 0.01
            self.vx = 0
        end
    elseif amount < 0 then
        if self:collidesWithMap(tilemap) then
            self.x = math.ceil(self.x / TILE_SIZE) * TILE_SIZE + 0.01
            self.vx = 0
        end
    end
end

function AI:moveY(amount, tilemap)
    self.y = self.y + amount
    if amount > 0 then
        if self:collidesWithMap(tilemap) then
            self.y = math.floor((self.y + self.height) / TILE_SIZE) * TILE_SIZE - self.height - 0.01
            self.vy = 0
            self.onGround = true
        else
            self.onGround = false
        end
    elseif amount < 0 then
        if self:collidesWithMap(tilemap) then
            self.y = math.ceil(self.y / TILE_SIZE) * TILE_SIZE + 0.01
            self.vy = 0
        end
    end
end

function AI:collidesWithMap(tilemap)
    local left = math.floor(self.x / TILE_SIZE) + 1
    local right = math.floor((self.x + self.width - 0.01) / TILE_SIZE) + 1
    local top = math.floor(self.y / TILE_SIZE) + 1
    local bottom = math.floor((self.y + self.height - 0.01) / TILE_SIZE) + 1

    for ty = top, bottom do
        for tx = left, right do
            if tilemap:isSolid(tx, ty) then
                return true
            end
        end
    end
    return false
end

function AI:getCenter()
    return self.x + self.width / 2, self.y + self.height / 2
end

function AI:draw(cameraX, cameraY)
    local drawX = self.x - cameraX
    local drawY = self.y - cameraY

    -- Draw AI body (red for TEAM_RIGHT)
    if self.team == TEAM_LEFT then
        love.graphics.setColor(0.2, 0.4, 0.8, 1)
    else
        love.graphics.setColor(0.8, 0.2, 0.2, 1)
    end
    love.graphics.rectangle("fill", drawX, drawY, self.width, self.height)

    -- Draw outline
    love.graphics.setColor(0, 0, 0, 1)
    love.graphics.rectangle("line", drawX, drawY, self.width, self.height)

    -- Draw "AI" label
    love.graphics.setColor(1, 1, 1, 1)
    love.graphics.print("AI", drawX + 4, drawY + 10)

    -- Draw health bar
    local barWidth = self.width
    local barHeight = 4
    local barY = drawY - barHeight - 2

    love.graphics.setColor(0.3, 0.3, 0.3, 1)
    love.graphics.rectangle("fill", drawX, barY, barWidth, barHeight)

    love.graphics.setColor(0.8, 0, 0, 1)
    local healthPercent = self.health / self.maxHealth
    love.graphics.rectangle("fill", drawX, barY, barWidth * healthPercent, barHeight)

    -- Draw state indicator (for debugging)
    love.graphics.setColor(1, 1, 1, 0.7)
    love.graphics.print(self.state, drawX - 10, drawY - 20)

    love.graphics.setColor(1, 1, 1, 1)
end

return AI
