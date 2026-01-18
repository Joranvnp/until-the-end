local Tilemap = {}
Tilemap.__index = Tilemap

function Tilemap.new(width, height)
    local self = setmetatable({}, Tilemap)
    self.width = width
    self.height = height
    self.tiles = {}

    for y = 1, height do
        self.tiles[y] = {}
        for x = 1, width do
            self.tiles[y][x] = TILE_EMPTY
        end
    end

    return self
end

function Tilemap:generate()
    local centerX = math.floor(self.width / 2)

    for y = 1, self.height do
        for x = 1, self.width do
            local groundLevel = math.floor(self.height * 0.3)

            if y <= groundLevel then
                self.tiles[y][x] = TILE_EMPTY
            else
                local distFromCenter = math.abs(x - centerX)
                local depth = y - groundLevel

                if depth <= 3 then
                    self.tiles[y][x] = TILE_DIRT
                elseif math.random() < 0.3 then
                    self.tiles[y][x] = TILE_DIRT
                else
                    self.tiles[y][x] = TILE_STONE
                end

                -- Ore generation: more valuable ores near center
                if depth > 5 then
                    local oreChance = math.random()
                    local centerFactor = 1 - (distFromCenter / centerX)

                    if oreChance < 0.02 * centerFactor then
                        self.tiles[y][x] = TILE_ORE_GOLD
                    elseif oreChance < 0.05 * centerFactor then
                        self.tiles[y][x] = TILE_ORE_SILVER
                    elseif oreChance < 0.1 then
                        self.tiles[y][x] = TILE_ORE_COPPER
                    end
                end
            end
        end
    end
end

function Tilemap:getTile(x, y)
    if x < 1 or x > self.width or y < 1 or y > self.height then
        return TILE_STONE
    end
    return self.tiles[y][x]
end

function Tilemap:setTile(x, y, tileType)
    if x >= 1 and x <= self.width and y >= 1 and y <= self.height then
        self.tiles[y][x] = tileType
    end
end

function Tilemap:worldToTile(worldX, worldY)
    local tileX = math.floor(worldX / TILE_SIZE) + 1
    local tileY = math.floor(worldY / TILE_SIZE) + 1
    return tileX, tileY
end

function Tilemap:tileToWorld(tileX, tileY)
    local worldX = (tileX - 1) * TILE_SIZE
    local worldY = (tileY - 1) * TILE_SIZE
    return worldX, worldY
end

function Tilemap:isSolid(tileX, tileY)
    local tile = self:getTile(tileX, tileY)
    return tile ~= TILE_EMPTY
end

function Tilemap:dig(tileX, tileY)
    local tile = self:getTile(tileX, tileY)
    if tile ~= TILE_EMPTY and tileX >= 1 and tileX <= self.width and tileY >= 1 and tileY <= self.height then
        self.tiles[tileY][tileX] = TILE_EMPTY
        return tile
    end
    return nil
end

function Tilemap:place(tileX, tileY, tileType)
    if tileX >= 1 and tileX <= self.width and tileY >= 1 and tileY <= self.height then
        if self.tiles[tileY][tileX] == TILE_EMPTY then
            self.tiles[tileY][tileX] = tileType
            return true
        end
    end
    return false
end

function Tilemap:draw(cameraX, cameraY)
    local screenWidth = love.graphics.getWidth()
    local screenHeight = love.graphics.getHeight()

    local startX = math.max(1, math.floor(cameraX / TILE_SIZE))
    local startY = math.max(1, math.floor(cameraY / TILE_SIZE))
    local endX = math.min(self.width, math.ceil((cameraX + screenWidth) / TILE_SIZE) + 1)
    local endY = math.min(self.height, math.ceil((cameraY + screenHeight) / TILE_SIZE) + 1)

    for y = startY, endY do
        for x = startX, endX do
            local tile = self.tiles[y][x]
            if tile ~= TILE_EMPTY then
                local color = TILE_COLORS[tile]
                love.graphics.setColor(color)
                local drawX = (x - 1) * TILE_SIZE - cameraX
                local drawY = (y - 1) * TILE_SIZE - cameraY
                love.graphics.rectangle("fill", drawX, drawY, TILE_SIZE, TILE_SIZE)

                love.graphics.setColor(0, 0, 0, 0.3)
                love.graphics.rectangle("line", drawX, drawY, TILE_SIZE, TILE_SIZE)
            end
        end
    end

    love.graphics.setColor(1, 1, 1, 1)
end

return Tilemap
