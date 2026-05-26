const {ccclass, property} = cc._decorator;

@ccclass
export default class MapCollider extends cc.Component {

    @property(cc.Prefab)
    questionPrefab: cc.Prefab = null;

    onLoad () {
        let tiledMap = this.node.getComponent(cc.TiledMap);
        let tileSize = tiledMap.getTileSize();

        // 1. 生成普通地板 (維持不變)
        this.createCollidersForLayer(tiledMap, "top", "default", tileSize);
        this.createCollidersForLayer(tiledMap, "toponBlack", "default", tileSize);
        this.createCollidersForLayer(tiledMap, "flagBase", "default", tileSize);

        // 2. 生成單向穿透平台 (維持不變)
        this.createCollidersForLayer(tiledMap, "oneway", "oneway", tileSize);

        // 🌟 3. 生成問號磚塊 (改成兩行，多傳一個數字進去：0 代表金幣，1 代表蘑菇)
        this.replaceTilesWithPrefabs(tiledMap, "question_coin", this.questionPrefab, tileSize, 0);
        this.replaceTilesWithPrefabs(tiledMap, "question_mushroom", this.questionPrefab, tileSize, 1);
    }

    // 寫一個共用的生成函數，這樣以後你要加冰塊、岩漿圖層都很方便
    createCollidersForLayer(tiledMap: cc.TiledMap, layerName: string, groupName: string, tileSize: cc.Size) {
        let layer = tiledMap.getLayer(layerName);
        if (!layer) return; // 如果沒畫這個圖層就跳過
        
        let layerSize = layer.getLayerSize();

        // 加入剛體
        let rigidBody = layer.node.addComponent(cc.RigidBody);
        rigidBody.type = cc.RigidBodyType.Static;

        // 🌟 核心魔法：強制把這個圖層的「物理群組」改成我們指定的名字
        layer.node.group = groupName;

        // 掃描地磚並加上碰撞框
        for (let x = 0; x < layerSize.width; x++) {
            for (let y = 0; y < layerSize.height; y++) {
                if (layer.getTileGIDAt(x, y) !== 0) {
                    let collider = layer.node.addComponent(cc.PhysicsBoxCollider);
                    collider.size = tileSize;
                    
                    let posX = x * tileSize.width + tileSize.width / 2;
                    let posY = (layerSize.height - y - 1) * tileSize.height + tileSize.height / 2;
                    
                    collider.offset = cc.v2(posX, posY);
                    collider.apply(); 
                }
            }
        }
    }

    // 🌟 函數名稱後面多加了一個 itemType: number
    replaceTilesWithPrefabs(tiledMap: cc.TiledMap, layerName: string, prefab: cc.Prefab, tileSize: cc.Size, itemType: number) {
        if (!prefab) return; 
        
        let layer = tiledMap.getLayer(layerName);
        if (!layer) return; 
        
        let layerSize = layer.getLayerSize();

        for (let x = 0; x < layerSize.width; x++) {
            for (let y = 0; y < layerSize.height; y++) {
                
                if (layer.getTileGIDAt(x, y) !== 0) {
                    
                    let posX = x * tileSize.width + tileSize.width / 2;
                    let posY = (layerSize.height - y - 1) * tileSize.height + tileSize.height / 2;
                    
                    let block = cc.instantiate(prefab);
                    
                    // 🌟 核心魔法：強制把生出來的磚塊，設定成我們要的道具類型！
                    let script = block.getComponent("QuestionBlock");
                    if (script) {
                        script.blockType = itemType; 
                    }
                    
                    block.setPosition(posX, posY);
                    layer.node.addChild(block);
                    
                    layer.setTileGIDAt(0, x, y);
                }
            }
        }
    }
}