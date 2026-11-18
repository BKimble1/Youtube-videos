shader_type spatial;
// Trailer flashlight lens glare: a camera-facing sprite at the lens whose
// brightness follows how squarely the beam points at the camera (the node's
// -Z is the beam).  A hot core, a soft halo and a horizontal streak, bright
// enough to bloom when the beam swings into the lens.
render_mode blend_add, unshaded, cull_disabled, depth_draw_never, depth_test_disabled, shadows_disabled, fog_disabled;

uniform vec3 color : source_color = vec3(1.0, 0.94, 0.82);
uniform float intensity = 1.0;
uniform float occlude = 1.0;

varying float v_align;

void vertex() {
	vec3 beam_dir = normalize(-MODEL_MATRIX[2].xyz);
	vec3 to_cam = normalize(CAMERA_POSITION_WORLD - NODE_POSITION_WORLD);
	v_align = max(dot(beam_dir, to_cam), 0.0);
	// billboard
	MODELVIEW_MATRIX = VIEW_MATRIX * mat4(INV_VIEW_MATRIX[0], INV_VIEW_MATRIX[1], INV_VIEW_MATRIX[2], MODEL_MATRIX[3]);
}

void fragment() {
	vec2 p = UV * 2.0 - 1.0;
	float r = length(p);
	float a = pow(v_align, 10.0);
	float a2 = pow(v_align, 3.0);
	float core = exp(-r * r * 90.0) * 6.0;
	float halo = exp(-r * r * 6.0) * 0.6;
	float streak = exp(-p.y * p.y * 900.0) * exp(-abs(p.x) * 2.2) * 1.6;
	float glint = exp(-r * r * 400.0) * 1.5 * a2;
	ALBEDO = color * intensity * occlude * ((core + halo + streak) * a + glint);
}
