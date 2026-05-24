const {ccclass, property} = cc._decorator;

@ccclass
export default class MapCollider extends cc.Component {

    @property(cc.Prefab)
    questionPrefab: cc.Prefab = null;

    onLoad () {
        let tiledMap = this.node.getComponent(cc.TiledMap);
        let tileSize = tiledMap.getTileSize();

        // 1. 生成普通地板 (讀取 top 圖層，放入 default 群組)
        this.createCollidersForLayer(tiledMap, "top", "default", tileSize);
        this.createCollidersForLayer(tiledMap, "toponBlack", "default", tileSize);
        this.createCollidersForLayer(tiledMap, "flagBase", "default", tileSize);

        // 2. 生成單向穿透平台 (讀取 oneway 圖層，放入 oneway 群組)
        this.createCollidersForLayer(tiledMap, "oneway", "oneway", tileSize);

        this.replaceTilesWithPrefabs(tiledMap, "question", this.questionPrefab, tileSize);
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

    replaceTilesWithPrefabs(tiledMap: cc.TiledMap, layerName: string, prefab: cc.Prefab, tileSize: cc.Size) {
        if (!prefab) return; // 如果沒掛藍圖就不執行
        
        let layer = tiledMap.getLayer(layerName);
        if (!layer) return; 
        
        let layerSize = layer.getLayerSize();

        // 掃描整張地圖的 questions 圖層
        for (let x = 0; x < layerSize.width; x++) {
            for (let y = 0; y < layerSize.height; y++) {
                
                // 如果這個格子有畫東西 (不是空格子)
                if (layer.getTileGIDAt(x, y) !== 0) {
                    
                    // 1. 算出它的精準世界座標 (跟碰撞體的算法一模一樣)
                    let posX = x * tileSize.width + tileSize.width / 2;
                    let posY = (layerSize.height - y - 1) * tileSize.height + tileSize.height / 2;
                    
                    // 2. 用藍圖印出一個真實的問號方塊！
                    let block = cc.instantiate(prefab);
                    
                    // 3. 把它放在算好的位置上，並成為地圖的孩子 (這樣才會跟著地圖縮放)
                    block.setPosition(posX, posY);
                    layer.node.addChild(block);
                    
                    // 4. 【神不知鬼不覺】把 TiledMap 上原本的圖案「擦掉」 (GID 設為 0)
                    // 這樣畫面就不會有兩個方塊重疊了！
                    layer.setTileGIDAt(0, x, y);
                }
            }
        }
    }
}