import { Component, OnInit } from '@angular/core';
import { GameService } from '../game.service';
import { FirebaseListObservable } from 'angularfire2/database';
import { Scene } from '../models/scene.model';
import { paper } from 'paper';

@Component({
  selector: 'app-display',
  templateUrl: './display.component.html',
  styleUrls: ['./display.component.css'],
  providers: [GameService]
})
export class DisplayComponent implements OnInit {

  constructor(private gameService: GameService) {}
  scenes = [];
  sceneMap = [];
  map = [];
  // start scene for example game currently live on firbase
  // startId: string = '-KnRYDhvTAnsKc_xPyrT';
  // start scene for ellis prototype
  startId: string = '-KocxsUvQocHQsE5b4lR';


  ngOnInit() {
    paper.install(window);
    paper.setup(document.getElementById('canvas'));
    this.gameService.allScenes().subscribe(data => {
      this.scenes = data;
    });
  }

  searchTree(){
    let start = this.scenes.find(scene => {
      return scene.$key === this.startId;
    });
    // console.log(this.scenes);
    // console.log(start);
    this.sceneMap.push({scene: start, depth: 0});
    let next = {
      depth: 1,
      scenes: []
    };
    start.choices.forEach(choice => {
      let success = this.findSceneById(choice.success.id);
      let fail = this.findSceneById(choice.fail.id);
      // if (success) this.findNext(success, 1);
      // if(success && this.isInSceneMap(success)) next.scenes.push(success);
      if(success && this.isInSceneMap(success)){
        success.parent_id = start.$key;
        next.scenes.push(success)
      }
      // if (fail) this.findNext(fail, 1);
      // if(fail && this.isInSceneMap(fail)) next.scenes.push(fail);
      if(fail && this.isInSceneMap(fail)){
        fail.parent_id = start.$key;
        next.scenes.push(fail)
      }
    });
    next = this.addToSceneMap(next);
    this.map.push({
      depth: 0,
      num_of_nodes: 1,
      clusters: [
        {
          num_of_nodes: 1,
          parent_node_id: null,
          nodes: [
            {
              depth: 0,
              x: null,
              y: null,
              scene_id: start.$key,
              id: 0,
              parent_id: null
            } //node object
          ]
        }
      ],
      width: 0,
      raw_nodes: [
        {
          depth: 0,
          x: null,
          y: null,
          scene_id: start.$key,
          id: 0,
          parent_id: null
        } //node object
      ],
    })
    this.findNext(next)
    // console.log(this.sceneMap.sort((a,b) =>{return a.depth - b.depth}))

  }

  isInSceneMap(scene){
    // if(scene.endGame) return false;
    let out = this.sceneMap.find(s => {
      return s.scene.$key === scene.$key
    });

    if(out) return false;
    return true;
  }

  addToSceneMap(next){
    // need filtering duplicate nodes from next scene
    // current scene data is sanitized
    let toMap = {
      depth: next.depth,
      num_of_nodes: next.scenes.length,
      clusters: [],
      width: 0,
      raw_nodes: [],
    }

    let maybeNext = next.scenes.filter((scene, index) => {
      this.sceneMap.push({title: scene.title, scene: scene, depth: next.depth-1})
      toMap.raw_nodes.push({
        depth: next.depth,
        x: null,
        y: null,
        scene_id: scene.$key, //should eventually reference position or key of actual scene data for editor purposes
        id: index,
        parent_id: scene.parent_id // all nodes need parent id
      }) //node object

      return !scene.endGame
    });
    // DONE: map clusters
    // clusters grouped by parent_id
    // clusters have:
    // - num_of_nodes (in cluster)
    // - parent_node_id (parent_id which all nodes in cluster share)
    // - nodes (array of nodes in cluster) (could also be array of ids referencing raw_nodes index)

    // unnecessary, pass desired clusters forward
    // TODO: pass unique parent_id array from previous depth
    let uniq = toMap.raw_nodes.filter((scene, index) => {
      return index === toMap.raw_nodes.findIndex(node => {
        return node.parent_id === scene.parent_id
      })
    })

    uniq.forEach(parent_node => {
      let nodes = toMap.raw_nodes.filter(scene => {
        // console.log(`scene parent: ${scene.parent_id}`);
        // console.log(`parent: ${parent_node.id}`);
        return scene.parent_id === parent_node.parent_id
      })
      toMap.clusters.push({
        num_of_nodes: nodes.length,
        parent_node_id: parent_node.parent_id,
        nodes: nodes
      })
    })

    // pushing new group object into map
    this.map.push(toMap);
    next.scenes = maybeNext;
    return next;
  }

  // TODO: filter duplicates in node generation, but remember them for path generation
  findNext(current){
    let next = {
      depth: current.depth+1,
      scenes: []
    }
    console.log(`depth: ${current.depth}`);

    current.scenes.forEach(scene => {
      scene.choices.forEach(choice => {
        let success = this.findSceneById(choice.success.id);
        let fail = this.findSceneById(choice.fail.id);
        // if(success && this.isInSceneMap(success)) next.scenes.push(success);
        // if(fail && this.isInSceneMap(fail)) next.scenes.push(fail);
        if(success && this.isInSceneMap(success)){
          success.parent_id = scene.$key;
          next.scenes.push(success)
        }
        if(fail && this.isInSceneMap(fail)){
          fail.parent_id = scene.$key;
          next.scenes.push(fail)
        }
      });
    });
    console.log(`next scenes: ${next.scenes.length}`);
    if(next.scenes.length > 0){
      // this.filterDuplicates()
      next = this.addToSceneMap(next);
      // NOTE: new order: filter duplicate scenes from next, add them to scene map, then remove andgame scenes from next calculation
      // NOTE: still need some way to handle duplicate nodes at depth. they should probably be filtered before adding to the scenemap.
      this.findNext(next);
    } else {
      this.startMap();
    }
  }

  startMap(){
    this.mapScenes();
    paper.view.draw();
  }

  mapScenes(){

    this.map.sort((a,b) => {
      return a.depth - b.depth
    });

    let sceen_width = paper.view.bounds.width;
    let screen_height = paper.view.bounds.height;
    let initial_group = this.map.slice(-1)[0];
    let y_spacing = screen_height/(initial_group.raw_nodes.length+1);
    //should eventually be dynamic to accomadate for any size story
    let x_spacing = 100;
    let elements = [];

    initial_group.raw_nodes.forEach(node => {
      node.x = (node.depth + 1) * x_spacing;
      node.y = (node.id + 1) * y_spacing;
      let p = new paper.Point(node.x,node.y);
      let c = new paper.Shape.Circle(p, 5);
      c.setFillColor('white')
      elements.push(c,p);
    });

    this.map[0].raw_nodes[0].x = (this.map[0].depth + 1) * x_spacing;
    let child_width = (initial_group.num_of_nodes - 1) * y_spacing;
    this.map[0].raw_nodes[0].y = (initial_group.raw_nodes[0].y) + child_width/2;
    let p1 = new paper.Point(this.map[0].raw_nodes[0].x, this.map[0].raw_nodes[0].y);
    let c1 = new paper.Shape.Circle(p1, 5);
    c1.setFillColor('white')

    for(let i = this.map.length - 2; i > 0; i--){
      let group = this.map[i];
      // console.log(this.map[i+1])
      group.raw_nodes.forEach(node => {
        let cluster = this.map[i+1].clusters.find(cluster => {
          return cluster.parent_node_id === node.scene_id
        });
        node.x = (node.depth + 1) * x_spacing;
        let child_width = (cluster.nodes.length - 1) * y_spacing;
        node.y = cluster.nodes[0].y + (child_width / 2)
      });
      group.raw_nodes.forEach(node => {
        let p = new paper.Point(node.x,node.y);
        let c = new paper.Shape.Circle(p, 5);
        c.setFillColor('white')
        elements.push(c,p);
      });
    }
  }

  // findNext(scene, depth: number){
  //   if(scene.endGame) return;
  //   let nextScene = this.sceneMap.find(s => {
  //     return s.scene.$key === scene.$key
  //   });
  //
  //   if(nextScene){
  //     return;
  //   };
  //   this.sceneMap.push({scene: scene, depth: depth});
  //   console.log(`depth: ${depth} title: ${scene.text}`);
  //   // console.log(scene.choices);
  //   scene.choices.forEach(choice => {
  //     // console.log(this.sceneMap);
  //     let success = this.findSceneById(choice.success.id);
  //     let fail = this.findSceneById(choice.fail.id);
  //     // console.log(`${choice.success.text}`)
  //     if (success) this.findNext(success, depth+1);
  //     // console.log(`${choice.fail.text}`);
  //     if (fail) this.findNext(fail, depth+1);
  //   });
  // }

  findSceneById(id: string){
    return this.scenes.find(scene => {
      return scene.$key === id;
    });
  }
}
