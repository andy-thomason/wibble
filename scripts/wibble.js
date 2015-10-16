/// @file scene.js
/// Classes for a simple retained-mode scene
/// (C) Andy Thomason 2015
/// https://opensource.org/licenses/MIT

// This is necessary to use modern Javascript classes.
"use strict";

/// A geometry component
class Component {
  constructor(gl, vertices, indices) {
    this.vbo = gl.createBuffer();
    var v = new Float32Array(vertices);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, v, gl.STATIC_DRAW);

    this.ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int32Array(indices), gl.STATIC_DRAW);

    this.num_indices = indices.length;
    this.stride = 36;
    this.attrs = [
      { semantic: "POSITION", size: 3, type: gl.FLOAT, normalized: false, offset: 0 },
      { semantic: "NORMAL", size: 3, type: gl.FLOAT, normalized: false, offset: 12 },
      { semantic: "COLOR", size: 3, type: gl.FLOAT, normalized: false, offset: 24 },
    ];
  }
}

/// A material with uniforms and a shader program
class Material {
  constructor(program, uniforms) {
    this.program = program;
    this.uniforms = uniforms;
  }
}

/// A node in the heirachy with a transform
class Node {
  constructor() {
    this.node_to_parent = mat4.create();
    this.parent = null;
  }

  add_child(child) {
    if (this.children == null) {
      this.children = [child];
    } else {
      this.children.push_back(child);
    }
    child.parent = this;
    return this;
  }

  translate(value) {
    mat4.translate(this.node_to_parent, value);
    return this;
  }

  rotate(angle, axis) {
    mat4.rotate(this.node_to_parent, angle, axis);
  }

  identity() {
    mat4.identity(this.node_to_parent);
    return this;
  }

  set_mat4(value) {
    mat4.set(this.node_to_parent, value);
    return this;
  }

  set_mat3(value) {
    mat3.toMat4(this.node_to_parent, value);
    return this;
  }

  toString() {
    return mat4.str(this.node_to_parent);
  }

  get_node_to_world(dest) {
    var node = this;
    mat4.set(dest, this.node_to_parent);
    while (node.parent != null) {
      node = node.parent;
      // todo: check the order of the multiply here.
      mat4.multiply(this.node_to_parent, dest, dest);
    }
    return this;
  }
}

/// A drawable node
class GeometryNode extends Node {
  constructor(components, material) {
    super();
    this.geometry = {
      components: components,
      material: material,
    }
  }
}

/// A camera node
class CameraNode extends Node {
  constructor(yfov, znear, zfar) {
    super();
    this.optics = {
      yfov: yfov,
      znear: znear,
      zfar: zfar,
    };
  }
}

/// A scene with cameras and lights
class Scene {
  /// construct a scene object.
  constructor() {
    this.canvas = document.getElementById("canvas");
    console.log("canvas=" + this.canvas);

    var gl = null;
    try {
      gl = this.canvas.getContext("webgl") || this.canvas.getContext("experimental-webgl");
      gl.viewportWidth = canvas.width;
      gl.viewportHeight = canvas.height;
    } catch (e) {
      console.log("throw!");
    }
    if (!gl) {
      alert("Your browser does not support WebGL, consider using Firefox.");
      return;
    }

    this.gl = gl;

    var indices = [0, 1, 2];
    var vertices = [
      -1, -1,  0, 0, 0, 1, 1, 0, 0,
      -1,  1,  0, 0, 0, 1, 1, 0, 0,
        1, -1,  0, 0, 0, 1, 1, 0, 0
    ];
    var commponents = [new Component(gl, vertices, indices)];
    var program = this.make_program("shaders/molecule.glsl");
    var material = new Material(program, {});

    this.scene = {
      camera: new CameraNode(45, 0.1, 1000.0).translate([0, 0, 5]),
      molecule: new GeometryNode(commponents, material),
    }

    this.active_camera = this.scene.camera;

    // this object contains information to communticate to the server
    this.to_server = {}

    // this object contains information from the server
    this.from_server = {}
  }

  /// render the current frame
  do_frame(request) {
    this.from_server = request;
    var to_server = {}

    var gl = this.gl;

    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clearColor(.5, .5, .5, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    var camera_to_perspective = mat4.create();
    var model_to_camera = mat4.create();
    var model_to_perspective = mat4.create();
    var model_to_world = mat4.create();
    var world_to_camera = mat4.create();
    var camera_to_world = mat4.create();

    this.active_camera.get_node_to_world(camera_to_world);
    mat4.inverse(camera_to_world, world_to_camera);

    var optics = this.active_camera.optics;
    mat4.perspective(optics.yfov, gl.viewportWidth / gl.viewportHeight, optics.znear, optics.zfar, camera_to_perspective);

    for (var s in this.scene) {
      var node = this.scene[s];
      var geometry = node.geometry;
      if (geometry) {
        //console.log(s + ": " + node.geometry.components.length);
        var model_to_world = node.node_to_parent;
        //console.log("model_to_world=" + mat4.str(model_to_world));

        //mat4.set(world_to_camera, model_to_camera);
        //mat4.multiply(model_to_world, model_to_camera, model_to_camera);
        //console.log("model_to_camera=" + mat4.str(model_to_camera));

        //mat4.set(model_to_camera, model_to_perspective);
        //mat4.multiply(camera_to_perspective, model_to_perspective, model_to_perspective);

        //console.log("model_to_perspective=" + mat4.str(model_to_perspective));

        //tmp = [0, 0, 0, 0];
        //mat4.multiplyVec4(camera_to_perspective, [0, 0, 0, 1], tmp);
        //console.log("t=" + tmp);

        mat3.identity(model_to_perspective);
        mat3.identity(model_to_camera);

        var material = geometry.material;
        var program = geometry.material.program;
        gl.useProgram(program);
        gl.uniformMatrix4fv(program.model_to_perspective, false, model_to_perspective);
        gl.uniformMatrix4fv(program.model_to_camera, false, model_to_camera);

        var components = node.geometry.components;
        for (var c in components) {
          var component = components[c];
          console.log("c: " + component.vbo + " i: " + component.ibo);

          gl.bindBuffer(gl.ARRAY_BUFFER, component.vbo);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, component.ibo);

          for (var a in component.attrs) {
            var attr = component.attrs[a];
            var attr_index = gl.getAttribLocation(program, attr.semantic);
            console.log("attr[" + attr_index + "] n=" + attr.semantic + " s=" + attr.size + " t=" + attr.type + " n=" + attr.normalized + " st=" + component.stride + " o=" + attr.offset);
            gl.vertexAttribPointer(attr_index, attr.size, attr.type, attr.normalized, component.stride, attr.offset);
            gl.enableVertexAttribArray(attr_index);
            attr.index = attr_index;
          }

          gl.drawElements(gl.TRIANGLES, component.num_indices, gl.UNSIGNED_SHORT, 0);

          for (var a in component.attrs) {
            var attr = component.attrs[a];
            var attr_index = gl.getAttribLocation(program, attr.semantic);
            gl.disableVertexAttribArray(attr_index);
          }
        }
      }
    }

    return to_server;
  }

  /// make a shader program from a .glsl file
  make_program(shader_name) {
    function make_shader(gl, src, shader_type) {
      var def = shader_type == gl.FRAGMENT_SHADER ? "#define FRAGMENT_SHADER 1\n\n" : "#define VERTEX_SHADER 1\n\n";
      var shader = gl.createShader(shader_type);

      gl.shaderSource(shader, def + src);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
      }

      return shader;
    }

    var gl = this.gl;

    var req = new XMLHttpRequest();
    req.open("GET", shader_name, false);
    req.send(null);
    console.log(req.responseText);

    var program = gl.createProgram();
    gl.attachShader(program, make_shader(gl, req.responseText, gl.VERTEX_SHADER));
    gl.attachShader(program, make_shader(gl, req.responseText, gl.FRAGMENT_SHADER));
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      alert("could not compile " + shader_name);
    }

    program.model_to_camera = gl.getUniformLocation(program, "model_to_camera");
    program.model_to_perspective = gl.getUniformLocation(program, "model_to_perspective");
    return program;
  }

  /// handle key down events
  keydown(event) {
    var key = event.keyCode || event.which;
    this.to_server["key" + key] = true;
    console.log(to_server);
  }

  /// handle key up events
  keyup(event) {
    var key = event.keyCode || event.which;
    delete this.to_server["key" + key];
    console.log(to_server);
  }

  /// run the game loop
  run(e) {
    var request = new XMLHttpRequest();
    var thiz = this;
    request.responseType = "json";
    request.onreadystatechange = function () {
      if (request.readyState == 4 && request.status == 200) {
        //if (request.response) display(ctx, request.response);
        //console.log(request.response);
        console.log(thiz);
        var to_server = thiz.do_frame(request)

        var str = JSON.stringify(to_server);
        request.open("PUT", "/data", true);
        request.send(str);
      }
    }

    var to_server = thiz.do_frame(request)

    var str = JSON.stringify(to_server);
    request.open("PUT", "/data", true);
    request.send(str);
  }
}


