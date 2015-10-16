precision mediump float;

varying vec2 TEXCOORD0_;
varying vec3 NORMAL_;
varying vec3 COLOR_;

#ifdef VERTEX_SHADER
	attribute vec3 POSITION;
	attribute vec3 NORMAL;
	attribute vec3 COLOR;

	uniform mat4 model_to_camera;
	uniform mat4 model_to_perspective;

	void main(void) {
	  gl_Position = model_to_perspective * vec4(POSITION, 1.0);
	  NORMAL_ = (model_to_camera * vec4(NORMAL, 0.0)).xyz;
	  COLOR_ = COLOR;
	}
#endif

#ifdef FRAGMENT_SHADER
	void main(void) {
	  float diffuse_factor = dot(normalize(NORMAL_), normalize(vec3(0.3, 0.3, 1)));
	  diffuse_factor = diffuse_factor < 0.3 ? 0.3 : diffuse_factor;
	  gl_FragColor = vec4(COLOR_ * diffuse_factor, 1.0);
	}
#endif
