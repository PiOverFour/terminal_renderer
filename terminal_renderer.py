#terminal_renderer [file]

import argparse
parser = argparse.ArgumentParser(description="Render a 3D scene in the console")
parser.add_argument("files", metavar='FILE', nargs='*', help="files to render")

parser.add_argument("-rx", "--resolutionX", type=int, help="number of rows")
parser.add_argument("-ry", "--resolutionY", type=int, help="number of columns")
args = vars(parser.parse_args())

for arg in args:
    print(arg, args[arg])

# import sys
# sys.exit()


try:
    import curses
    fallback = False
except:
    fallback = True
    
from math import sin, cos, pi
import time
import json


DEBUG = False

class Vertex():
    def __init__(self, position):
        self.position = position
        
    def __repr__(self):
        return str(self.position)

class Edge():
    def __init__(self, v0, v1):
        self.v0 = v0
        self.v1 = v1


class Object3D(object):
    def __init__(self, position=[0.0,0.0,0.0], rotation=[0.0,0.0,0.0]):
        self.position = position
        self.rotation = rotation

class Mesh(Object3D):
    
    def __init__(self):
        super(Mesh, self).__init__()
        self.vertices = []
        self.edges = []
        
    @classmethod
    def from_list(cls, vertices, edges):
        mesh = Mesh()
        mesh.vertices = [Vertex(v) for v in vertices]
        mesh.edges = edges
        return mesh
        
    @classmethod
    def from_file(cls, file_path):
        with open(file_path, 'r') as f:
            data = json.loads(f.read())
        return Mesh.from_list(data['v'],data['e'])
        
#    def interpolate(self, v0,v1):
#        """Returns interpolated line between two vertices"""
#        pass
    
    def get_edges(self):
#        for vx in self.vertices:
#            pass
#        for edge in self.edges:
#            camera_points.append([self.vertices[edge[0]],self.vertices[edge[1]]])
        return [[self.vertices[edge[0]],self.vertices[edge[1]]] for edge in self.edges]
        
class Camera(Object3D):
    def __init__(self, position=[0.0,0.0,0.0], rotation=[0.0,0.0,0.0], focal_length=5):
        super(Camera, self).__init__(position, rotation)
        self.focal_length = focal_length
        
class Renderer():
    bkgd = ' '
    
    def __init__(self, resolution=[30,30]):
        self.resolution=resolution
        if not DEBUG:
            self.stdscr = curses.initscr()
            curses.noecho()
            curses.cbreak()
            curses.curs_set(False)
            self.stdscr.keypad(True)
            self.pad = self.stdscr
            self.resolution = [curses.LINES, curses.COLS]
#        self.pad = curses.newpad(*resolution)
#        self.pad.bkgd(self.bkgd)
#        self.pad.refresh( 0,0, 0,0, *resolution)
        
        self.scene = []
        
    def kill(self):
        self.stdscr.keypad(False)
        curses.nocbreak()
        curses.echo()
        curses.endwin()
        print('Renderer destroyed')
        
    def world_to_camera(self, point, camera):
        x = point.position[0] - camera.position[0]
        y = point.position[1] - camera.position[1]
        z = point.position[2] - camera.position[2]
        
        cosx = cos(camera.rotation[0])
        cosy = cos(camera.rotation[1])
        cosz = cos(camera.rotation[2])
        
        sinx = sin(camera.rotation[0])
        siny = sin(camera.rotation[1])
        sinz = sin(camera.rotation[2])
        
        dx = cosy * (sinz*y + cosz*x) - siny*z
        dy = sinx * (cosy*z + siny * (sinz*y + cosz*x)) + cosx * (cosz*y - sinz*x)
        dz = cosx * (cosy*z + siny * (sinz*y + cosz*x)) - sinx * (cosz*y - sinz*x)
#        
        bx = (camera.focal_length/dz) * dx
        by = (camera.focal_length/dz) * dy
        return [bx, by]
        
    def camera_to_display(self,edge):
        display_edge = []
        
#        p0 = point[0]
#        p1 = point[1]
        
        
        for p in edge:
            dp = []
            for i, c in enumerate(p):
                c += 1
                c *= 0.5 * self.resolution[i]
                c = int(round(c))
#                c = self.resolution[i] - c
                dp.append(c)
            dp.reverse()
            display_edge.append(dp)
        
        if DEBUG:
         print("\nde", display_edge)
         
#        p1 += 1
#        p1 *= 0.4 * self.resolution[1]
#        p1 = round(point[1])
#        p1 = self.resolution[1] - (p1)
#        display_point.append(p1)
#        
#        p0 += 1
#        p0 *= 0.5 * self.resolution[0]
#        p0 = round(p0)
#        display_point.append(p0)

        vector = list(map(lambda c0,c1:c1-c0, display_edge[0], display_edge[1]))
        
        real_slope = vector[1]/vector[0] if vector[0] != 0 else 3
        if -0.3 <= real_slope < 0.3:
            draw_char = "-"
        elif -2 <= real_slope < -0.3:
            draw_char = "/"
        elif 0.3 <= real_slope < 2:
            draw_char = "\\"
        elif real_slope < -2 or real_slope >= 2:
            draw_char = "|"
        else:
            draw_char = "e"
        
        if DEBUG:
            print('vector',vector)
        
        largest = max(abs(vector[0]),abs(vector[1]))
        if largest in vector:
            largest = vector.index(largest)
        else:
            largest = vector.index(-largest)
        smallest = abs(largest-1)
        
        if vector[largest] < 0:
            display_edge.reverse()

        if DEBUG:
            print('largest:', largest, 'smallest:', smallest)

        slope = float(vector[smallest])/vector[largest] if vector[largest] != 0 else 0
        if DEBUG:
            print("slope:", slope)
        display_points = []
#        range_step = -1 if vector[largest] < 0 else 1
#        range_step = 1
        for i, delta in enumerate(range(display_edge[0][largest], display_edge[1][largest]+1)):
            point = [delta, round(display_edge[0][smallest] + i*slope)]
            if largest==1:
                point.reverse()
            point.append(draw_char)
            display_points.append(point)
        if DEBUG:
            print('display points:', display_points)
            
        display_edge = [[v[0], v[1],'*'] for v in display_edge]
        return display_points
        
    def clear(self):
        if not DEBUG:
            self.pad.clear()
    
    def draw(self, display_point):
        try:
            self.pad.addch(display_point[0], display_point[1], display_point[2])
        except:
            pass
        
    def refresh(self):
        self.pad.refresh()
    
    def render(self, camera):
        self.clear()
        
        if DEBUG:
            print('Resolution:', self.resolution)
        
        
##        foreach object:
##            get world edges
##            transform edges to camera 2d space
##            create display point list
        
        world_edges = []
        for obj in self.scene:
            world_edges.extend(obj.get_edges())
        
        if DEBUG:
            print('world edges', world_edges)
        
        camera_edges = []
        for edge in world_edges:
            camera_edges.append([self.world_to_camera(edge[0], camera), self.world_to_camera(edge[1], camera)])

        if DEBUG:
          print('camera edges',camera_edges)

        for edge in camera_edges:
            display_points = self.camera_to_display(edge)
            for display_point in display_points:
#                x, y = self.camera_to_display(v)
                if DEBUG:
                    print(display_point)
                try:
                    self.draw(display_point)
                except:
                    raise
                    print('CANCELLED')
                    
        if not DEBUG:
            self.refresh()



class RendererFallback(Renderer):
    def __init__(self, resolution=[30,30]):
        self.resolution=resolution
        self.scene = []
        
    def kill(self):
        print('Work done!')
        
    def clear(self):
        self.output = [[' ']*self.resolution[0]]*self.resolution[1]
        
    def draw(self, display_point):
        try:
            self.output[display_point[1]][display_point[0]] = display_point[2]
        except:# when pixel is out of the screen
            pass
        
    def refresh(self):
        print('-'*20)
#        output = [''.join(o) for o in self.output]
        output = '\n'.join([''.join(o) for o in self.output])
        print(output)
        
    
    
if __name__ == '__main__':
    if DEBUG:
        print('-----------------')
    
    res = [40,80]
    if fallback:
        renderer = RendererFallback(res)
    else:
        renderer = Renderer(res)
    
    
    # cube
    v = [(-1.0, -1.0, -1.0), (-1.0, -1.0, 1.0), (-1.0, 1.0, -1.0), (-1.0, 1.0, 1.0), (1.0, -1.0, -1.0), (1.0, -1.0, 1.0), (1.0, 1.0, -1.0), (1.0, 1.0, 1.0)]
    e = [[0, 1], [1, 3], [3, 2], [2, 0], [3, 7], [7, 6], [6, 2], [7, 5], [5, 4], [4, 6], [5, 1], [0, 4]]

#    # plan
#    v = [[-1.0,0.0,0.0], [0.0,1.0,0.0], [-1.0,1.0,0.0], [-1.0,-1.0,0.0]]
#    e = [[0,1],[1,2],[2,3],[3,0]]

#    # icosaedre
#    v = [[0.0, 0.0, -1.0], [0.7235999703407288, -0.5257200002670288, -0.4472149908542633], [-0.27638500928878784, -0.8506399989128113, -0.4472149908542633], [-0.8944249749183655, 0.0, -0.4472149908542633], [-0.27638500928878784, 0.8506399989128113, -0.4472149908542633], [0.7235999703407288, 0.5257200002670288, -0.4472149908542633], [0.27638500928878784, -0.8506399989128113, 0.4472149908542633], [-0.7235999703407288, -0.5257200002670288, 0.4472149908542633], [-0.7235999703407288, 0.5257200002670288, 0.4472149908542633], [0.27638500928878784, 0.8506399989128113, 0.4472149908542633], [0.8944249749183655, 0.0, 0.4472149908542633], [0.0, 0.0, 1.0]]
#    e = [[2, 0], [0, 1], [1, 2], [5, 1], [0, 5], [3, 0], [2, 3], [4, 0], [3, 4], [4, 5], [10, 1], [5, 10], [6, 2], [1, 6], [7, 3], [2, 7], [8, 4], [3, 8], [9, 5], [4, 9], [10, 6], [6, 7], [7, 8], [8, 9], [9, 10], [11, 6], [10, 11], [11, 7], [11, 8], [11, 9]]
#    cube.from_list(v, e)

    import os

    if len(args['files']) != 0:
        for f in args['files']:
            if os.path.exists(f):
                try:
                    object = Mesh.from_file(f)
                    renderer.scene.append(object)
                except:
                    pass
    else:
        object = Mesh.from_list(v, e)
        renderer.scene.append(object)
    
    angle = 0
    while True:
        try:
            camera = Camera((cos(angle)*5, 0, sin(angle)*5), (pi/2-angle, 0, pi/2), 3)
            renderer.render(camera)
            angle += pi/100
            time.sleep(.01)
        except KeyboardInterrupt:
            if not DEBUG:
                renderer.kill()
            break
    
#    camera = Camera((2.0, 0.0, 5), (0.0,0.5,0.0), 2)
##    print('camera',camera.position, camera.rotation, camera.focal_length)