export const blocks = {
    empty:{
        id: 0,
        name: "Empty"
    },
    grass:{
        id: 1,
        name: "Grass",
        color: 0x559020
    },
    dirt:{
        id: 2,
        name: "Dirt",
        color: 0x807020
    },
    stone:{
        id: 3,
        name: "Stone",
        color: 0x808080,
        scale: {x: 30, y: 30, z: 30},
        scarcity: 0.5
    },
    coalOre:{
        id: 4,
        name: "Coal Ore",
        color: 0x202020,
        scale: {x: 20, y: 20, z: 20},
        scarcity: 0.8
    },
    ironOre:{
        id: 5,
        name: "Iron Ore",
        color: 0x909000,
        scale: {x: 60, y: 60, z: 60},
        scarcity: 0.9
    },
}

export const resources = [
    blocks.stone,
    blocks.coalOre,
    blocks.ironOre
]