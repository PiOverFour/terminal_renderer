// #terminal_renderer [file]

// import argparse
// parser = argparse.ArgumentParser(description="Render a 3D scene in the console")
// parser.add_argument("files", metavar='FILE', nargs='*', help="files to render")

// parser.add_argument("-rx", "--resolutionX", type=int, help="number of rows")
// parser.add_argument("-ry", "--resolutionY", type=int, help="number of columns")
// args = vars(parser.parse_args())

// for arg in args:
//     print(arg, args[arg])

// # import sys
// # sys.exit()


// try:
//     import curses
//     fallback = False
// except:
//     fallback = True
    
// from math import sin, cos, pi
// import time
// import json


var renderer;



// http://codepen.io/KryptoniteDove/blog/load-json-file-locally-using-pure-javascript
function loadJSON(filepath, callback) {   

    var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
    xobj.open('GET', filepath, true); // Replace 'my_data' with the path to your file
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(xobj.responseText);
        }
    };
    xobj.send(null);  
}


var DEBUG = false;

var Vertex = function ( position ) {

	this.position = position;

}
	// return this;

// class Vertex():
//     def __init__(self, position):
//         self.position = position
        
//     def __repr__(self):
//         return str(self.position)

var Edge = function (v0,v1) {

	this.v0 = v0;
	this.v1 = v1;

}

// class Edge():
//     def __init__(self, v0, v1):
//         self.v0 = v0
//         self.v1 = v1

var Object3D = function (position, rotation) {

	this.position = position;
	this.rotation = rotation;

}

// class Object3D(object):
//     def __init__(self, position=[0.0,0.0,0.0], rotation=[0.0,0.0,0.0]):
//         self.position = position
//         self.rotation = rotation

var Mesh = function (position, rotation) {

	this.position = position;
	this.rotation = rotation;

}

Mesh.prototype = {

	from_list: function(vertices, edges) {

		var mesh = new Mesh();
		mesh.vertices = [];
		for (var v = 0; v < vertices.length; v++) {
            // var vert = new Vertex;
			mesh.vertices.push(new Vertex( vertices[v] ));
		}
		mesh.edges = edges;
		return mesh;

	},

	from_data: function(data) {

		// var mesh = new Mesh();
		// var data = ;
		// mesh.vertices = [];
		// for (var v = 0; v < vertices.length; v++) {
		// 	mesh.vertices.push(new Vertex( vertices[v] ));
		// }
		// mesh.edges = edges;
		return this.from_list(data['v'], data['e']);

	},

	get_edges: function(data) {

		var edges = [];
		for (var e = 0; e < this.edges.length; e++) {
			edges.push( [ this.vertices[this.edges[e][0]], this.vertices[this.edges[e][1]] ] );
		}
		return edges;
        // return [[self.vertices[edge[0]],self.vertices[edge[1]]] for edge in self.edges]

	}

}

var Camera = function (position, rotation, focal_length=5) {

    this.position = position;
    this.rotation = rotation;
    this.focal_length = focal_length;

}


// class Mesh(Object3D):
    
//     def __init__(self):
//         super(Mesh, self).__init__()
//         self.vertices = []
//         self.edges = []
        
//     @classmethod
//     def from_list(cls, vertices, edges):
//         mesh = Mesh()
//         mesh.vertices = [Vertex(v) for v in vertices]
//         mesh.edges = edges
//         return mesh
        
//     @classmethod
//     def from_file(cls, file_path):
//         with open(file_path, 'r') as f:
//             data = json.loads(f.read())
//         return Mesh.from_list(data['v'],data['e'])
        
// #    def interpolate(self, v0,v1):
// #        """Returns interpolated line between two vertices"""
// #        pass
    
//     def get_edges(self):
// #        for vx in self.vertices:
// #            pass
// #        for edge in self.edges:
// #            camera_points.append([self.vertices[edge[0]],self.vertices[edge[1]]])
//         return [[self.vertices[edge[0]],self.vertices[edge[1]]] for edge in self.edges]
        




// class Camera(Object3D):
//     def __init__(self, position=[0.0,0.0,0.0], rotation=[0.0,0.0,0.0], focal_length=5):
//         super(Camera, self).__init__(position, rotation)
//         self.focal_length = focal_length

var Renderer = function(canvas, resolution=[30,30]) {
    this.resolution = resolution;
    this.scene = [];

    this.canvas = canvas;
    this.cContext = this.canvas.getContext("2d");
    // this.canvas = document.createElement( 'canvas' );
    var text = ['123456','789 ds dfs','789 ds dfs','789 ds dfs'];

    for (l in text) {
        this.cContext.font = "10px Mono";
        this.cContext.fillText(text[l],10,(l+6)*1.5);
        };
}

Renderer.prototype = {

    world_to_camera: function ( point, camera ) {
        var x = point.position[0] - camera.position[0];
        var y = point.position[1] - camera.position[1];
        var z = point.position[2] - camera.position[2];
        
        var cosx = Math.cos(camera.rotation[0])
        var cosy = Math.cos(camera.rotation[1])
        var cosz = Math.cos(camera.rotation[2])
        
        var sinx = Math.sin(camera.rotation[0])
        var siny = Math.sin(camera.rotation[1])
        var sinz = Math.sin(camera.rotation[2])
        
        var dx = cosy * (sinz*y + cosz*x) - siny*z
        var dy = sinx * (cosy*z + siny * (sinz*y + cosz*x)) + cosx * (cosz*y - sinz*x)
        var dz = cosx * (cosy*z + siny * (sinz*y + cosz*x)) - sinx * (cosz*y - sinz*x)

        var bx = (camera.focal_length/dz) * dx
        var by = (camera.focal_length/dz) * dy
        return [bx, by]
    },

    camera_to_display: function ( edge ) {

        var display_edge = [];
        
        // console.log("edge: " , edge);
        // console.log(edge);

        for (var p=0; p<2; p++) {

            var dp = [];
            for (var c=0; c<edge[p].length; c++) {
                edge[p][c] += 1;
                edge[p][c] *= (0.5 * this.resolution[c]);
                edge[p][c] = Math.round(edge[p][c])
                dp.push(edge[p][c])
            }
            dp.reverse();
            display_edge.push(dp)

        // console.log(JSON.stringify(display_edge));
        }
        
        // console.log("display edge: " + display_edge);

        var vector = [];

        for (var i = 0; i < display_edge[0].length; i++) {

            vector.push(display_edge[0][i] - display_edge[1][i]);

        }

        // console.log("vector: " + vector);

        // vector = list(map(lambda c0,c1:c1-c0, display_edge[0], display_edge[1]))
        
        var real_slope = (vector[0] != 0) ? vector[1]/vector[0] : 3;

        // console.log("real_slope: " + real_slope);

        if (-0.3 <= real_slope < 0.3 ) {

            draw_char = "-";
        }

        else if (-2 <= real_slope < -0.3) {

            draw_char = "/";

        }
        else if (0.3 <= real_slope < 2) {

            draw_char = "\\";

        }
        else if (real_slope < -2 || real_slope >= 2) {

            draw_char = "|";

        }
        else {

            draw_char = "e";

        }
        
         // console.log("draw_char: " + draw_char);

        // if DEBUG:
        //     print('vector',vector)
        
        var largest = Math.max(Math.abs(vector[0]), Math.abs(vector[1]));

        if (largest in vector) {

            largest = vector.indexOf(largest);

        }
        else {

            largest = vector.indexOf(-largest);

        }
        var smallest = Math.abs(largest-1);
        
        if (vector[largest] < 0) {

            display_edge.reverse()

        }

        // console.log("display edge: " + display_edge);

        // if DEBUG:
        //     print('largest:', largest, 'smallest:', smallest)

        var slope = (vector[largest] != 0) ? (vector[smallest])/vector[largest] : 0;
        // if DEBUG:
        //     print("slope:", slope)

        var display_points = [];

        for ( var i = display_edge[0][largest]; i < display_edge[1][largest]+1; i++ ) {

            var point = [i, Math.round(display_edge[0][smallest] + (i - display_edge[0][largest]) * slope)];
            if (largest == 1) {

                point.reverse();

            }

            point.push(draw_char);

            // console.log("point: " + point);
            
            display_points.push(point);

        }


        return display_points;

        // for i, delta in enumerate(range(display_edge[0][largest], display_edge[1][largest]+1)):
        //     point = [delta, round(display_edge[0][smallest] + i*slope)]
        //     if largest==1:
        //         point.reverse()
        //     point.append(draw_char)
        //     display_points.append(point)
        // if DEBUG:
        //     print('display points:', display_points)
            
        // display_edge = [[v[0], v[1],'*'] for v in display_edge]
        

    },

    clear: function() {


        this.cContext.clearRect ( 0 , 0 , this.canvas.width, this.canvas.height );

    },

    draw: function(display_point) {

        this.cContext.fillText(display_point[2],display_point[0],display_point[1]*1.5);
    },

    render: function(camera) {

        this.clear();

        var world_edges = []
        

        for (obji in this.scene) {

            var obj_edges = this.scene[obji].get_edges()
            for (edgei in obj_edges) {

                world_edges.push(obj_edges[edgei]);

            }
        }
        
        // if DEBUG:
        //     print('world edges', world_edges)
        
        // console.log(JSON.stringify(world_edges));

        var camera_edges = [];
        for (var e = 0; e < world_edges.length; e++) {
            camera_edges.push([this.world_to_camera(world_edges[e][0], camera), this.world_to_camera(world_edges[e][1], camera)])

        }
        // if DEBUG:
        //   print('camera edges',camera_edges)

        // console.log("camera_edges: " + JSON.stringify(camera_edges));

        for (e in camera_edges) {

            console.log(' ');

            // console.log("camera_edges " + e + ":" + (camera_edges[e]));

            var display_points = this.camera_to_display(camera_edges[e])
            
            // console.log("display_points: " + display_points);

            for (dp in display_points) {
                
                // console.log(JSON.stringify(display_points[dp]));
                this.draw(display_points[dp]);

            }

        }

    }

}


// TEST CALL

window.onload = function() {

    var canvas = document.getElementById( "screen" );
    renderer = new Renderer(canvas, [100,100]);

    loadJSON('dino.json', function(response) {
        var obj = JSON.parse(response);
        // console.log(obj);
        // renderer.
        var object = new Mesh;
        object = object.from_data(obj);
        renderer.scene.push(object);
        
        var angle = 0.2;

        var inter = setInterval( function() {
            var camera = new Camera([Math.cos(angle)*3, 0, Math.sin(angle)*3], [Math.PI/2-angle, 0, Math.PI/2], 5);
            renderer.render(camera);
            angle += Math.PI/40;

            clearInterval(inter);   //DEBUG

        }, 100)



    });

}
    
// if __name__ == '__main__':
//     if DEBUG:
//         print('-----------------')
    
//     # if len(args['resolutionY']) != 0:
//     rx = args['resolutionX'] if args['resolutionX'] else 40
//     ry = args['resolutionY'] if args['resolutionY'] else 80

//     res = [rx,ry]
//     if fallback:
//         renderer = RendererFallback(res)
//     else:
//         renderer = Renderer(res)
    
    
//     # cube
//     v = [(-1.0, -1.0, -1.0), (-1.0, -1.0, 1.0), (-1.0, 1.0, -1.0), (-1.0, 1.0, 1.0), (1.0, -1.0, -1.0), (1.0, -1.0, 1.0), (1.0, 1.0, -1.0), (1.0, 1.0, 1.0)]
//     e = [[0, 1], [1, 3], [3, 2], [2, 0], [3, 7], [7, 6], [6, 2], [7, 5], [5, 4], [4, 6], [5, 1], [0, 4]]

// #    # plan
// #    v = [[-1.0,0.0,0.0], [0.0,1.0,0.0], [-1.0,1.0,0.0], [-1.0,-1.0,0.0]]
// #    e = [[0,1],[1,2],[2,3],[3,0]]

// #    # icosaedre
// #    v = [[0.0, 0.0, -1.0], [0.7235999703407288, -0.5257200002670288, -0.4472149908542633], [-0.27638500928878784, -0.8506399989128113, -0.4472149908542633], [-0.8944249749183655, 0.0, -0.4472149908542633], [-0.27638500928878784, 0.8506399989128113, -0.4472149908542633], [0.7235999703407288, 0.5257200002670288, -0.4472149908542633], [0.27638500928878784, -0.8506399989128113, 0.4472149908542633], [-0.7235999703407288, -0.5257200002670288, 0.4472149908542633], [-0.7235999703407288, 0.5257200002670288, 0.4472149908542633], [0.27638500928878784, 0.8506399989128113, 0.4472149908542633], [0.8944249749183655, 0.0, 0.4472149908542633], [0.0, 0.0, 1.0]]
// #    e = [[2, 0], [0, 1], [1, 2], [5, 1], [0, 5], [3, 0], [2, 3], [4, 0], [3, 4], [4, 5], [10, 1], [5, 10], [6, 2], [1, 6], [7, 3], [2, 7], [8, 4], [3, 8], [9, 5], [4, 9], [10, 6], [6, 7], [7, 8], [8, 9], [9, 10], [11, 6], [10, 11], [11, 7], [11, 8], [11, 9]]
// #    cube.from_list(v, e)

//     import os

//     if len(args['files']) != 0:
//         for f in args['files']:
//             if os.path.exists(f):
//                 try:
//                     object = Mesh.from_file(f)
//                     renderer.scene.append(object)
//                 except:
//                     pass
//     else:
//         object = Mesh.from_list(v, e)
//         renderer.scene.append(object)
    
//     angle = 0
//     while True:
//         try:
//             camera = Camera((cos(angle)*5, 0, sin(angle)*5), (pi/2-angle, 0, pi/2), 3)
//             renderer.render(camera)
//             angle += pi/100
//             time.sleep(.01)
//         except KeyboardInterrupt:
//             if not DEBUG:
//                 renderer.kill()
//             break
    
// #    camera = Camera((2.0, 0.0, 5), (0.0,0.5,0.0), 2)
// ##    print('camera',camera.position, camera.rotation, camera.focal_length)