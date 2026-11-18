shader_type spatial;
// Trailer close-up version of the game's gold coin (assets/shaders/coin.gdshader):
// the same spin, bob and warm metal, with the face drawn like the game's own
// HUD coin icon (CoinView.draw_icon): a darker outer rim, an engraved ring and
// a highlight, so a coin passing the lens at 4K reads as a coin, not a disc.
render_mode diffuse_lambert, specular_schlick_ggx, shadows_disabled;

uniform vec3 gold : source_color = vec3(1.0, 0.76, 0.24);
uniform float glow = 0.3;
uniform float spin_speed = 1.8;
uniform float bob = 0.12;

varying vec3 v_lp;
varying vec3 v_ln;

void vertex() {
	v_lp = VERTEX;
	v_ln = NORMAL;
	float a = TIME * spin_speed + INSTANCE_CUSTOM.r * 6.2831;
	float c = cos(a);
	float s = sin(a);
	VERTEX = vec3(c * VERTEX.x + s * VERTEX.z, VERTEX.y, -s * VERTEX.x + c * VERTEX.z);
	NORMAL = vec3(c * NORMAL.x + s * NORMAL.z, NORMAL.y, -s * NORMAL.x + c * NORMAL.z);
	VERTEX.y += sin(TIME * 2.2 + INSTANCE_CUSTOM.r * 6.2831) * bob;
	VERTEX *= INSTANCE_CUSTOM.a;
}

void fragment() {
	vec3 col = gold;
	float r = length(v_lp.xy);
	if (abs(v_ln.z) > 0.6) {
		// the face: rim band, engraved ring, a highlight (mirrored on the back)
		float rim_band = smoothstep(0.288, 0.296, r);
		col = mix(col, vec3(0.80, 0.55, 0.16), rim_band);
		float ring = 1.0 - smoothstep(0.008, 0.016, abs(r - 0.19));
		col = mix(col, vec3(0.86, 0.58, 0.14), ring * 0.9);
		vec2 hp = v_lp.xy - vec2(-0.10 * sign(v_ln.z), 0.11);
		col += vec3(1.0, 0.95, 0.75) * 0.32 * exp(-dot(hp, hp) / 0.0036);
		// a soft radial falloff toward the rim, like a domed face
		col *= 1.0 - 0.18 * smoothstep(0.05, 0.29, r);
	} else {
		col = vec3(0.78, 0.54, 0.15);
	}
	float rimlight = pow(1.0 - clamp(dot(NORMAL, VIEW), 0.0, 1.0), 2.0);
	ALBEDO = col;
	METALLIC = 0.8;
	ROUGHNESS = 0.32;
	SPECULAR = 0.6;
	EMISSION = col * (glow + rimlight * 0.6);
}
