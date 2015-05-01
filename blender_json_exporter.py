#simple json exporter
import json
import bpy
from bpy.props import FloatProperty

def write_json_file(context, filepath, global_matrix ):

    mesh = context.object.to_mesh(bpy.context.scene, True, 'PREVIEW')
    mesh.transform(global_matrix * context.object.matrix_world)

    data = {}
    v = [list(vert.co) for vert in mesh.vertices]
    e = [list(edge.vertices) for edge in mesh.edges]

    data["v"] = v
    data["e"] = e
    print(data)

    with open(filepath, 'w') as file:
        file.write(json.dumps(data, indent=2))

    return {'FINISHED'}


# ExportHelper is a helper class, defines filename and
# invoke() function which calls the file selector.
from bpy_extras.io_utils import ExportHelper, orientation_helper_factory, axis_conversion
from bpy.props import StringProperty, BoolProperty, EnumProperty
from bpy.types import Operator


class SimpleJsonExporter(Operator, ExportHelper, orientation_helper_factory("IOOrientationHelper", axis_forward='Z', axis_up='Y')):
    """Exporter for the terminal render"""
    bl_idname = "export.terminal_render"  # important since its how bpy.ops.import_test.some_data is constructed
    bl_label = "Export object for terminal"

    # ExportHelper mixin class uses this
    filename_ext = ".json"

    filter_glob = StringProperty(
            default="*.json",
            options={'HIDDEN'},
            )

    global_scale = FloatProperty(
            name="Scale",
            min=0.01, max=1000.0,
            default=1.0,
            )

    def execute(self, context):
        from mathutils import Matrix
        global_matrix = (Matrix.Scale(self.global_scale, 4) *
                         axis_conversion(to_forward=self.axis_forward,
                                         to_up=self.axis_up,
                                         ).to_4x4())
        return write_json_file(context, self.filepath, global_matrix)


# Only needed if you want to add into a dynamic menu
def menu_func_export(self, context):
    self.layout.operator(ExportSomeData.bl_idname, text="Terminal Render")


def register():
    bpy.utils.register_class(SimpleJsonExporter)
    bpy.types.INFO_MT_file_export.append(menu_func_export)


def unregister():
    bpy.utils.unregister_class(SimpleJsonExporter)
    bpy.types.INFO_MT_file_export.remove(menu_func_export)


if __name__ == "__main__":
    register()

    # test call
    bpy.ops.export.terminal_render('INVOKE_DEFAULT')
