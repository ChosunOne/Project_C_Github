//23456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
//
// PointLightedSphere_perFragment.js (c) 2012 matsuda and kanda
//
// MODIFIED for EECS 351-1, Northwestern Univ. Jack Tumblin
//		Multiple light-sources: 'lamp0, lamp1, lamp2, etc
//			 RENAME: ambientLight --> lamp0amb, lightColor --> lamp0diff,
//							 lightPosition --> lamp0pos
//		Complete the Phong lighting model: add emissive and specular:
//		--Ke, Ka, Kd, Ks: K==Reflectance; emissive, ambient, diffuse, specular 
//		--    Ia, Id, Is:	I==Illumination:          ambient, diffuse, specular.
//		-- Kshiny: specular exponent for 'shinyness'.
//		-- Implemented Blinn-Phong 'half-angle' specular term (from class)
//
// 
//		JT:  HOW would we compute the REFLECTED direction R? Which shader
//		JT:  HOW would we find the 'view' direction, to the eye? Which shader?
//

// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Normal;\n' +
  //  'attribute vec4 a_color;\n' + 		// Per-vertex colors? they usually define
																				// Phong diffuse reflectance.
  'uniform vec3 u_Kd;\n' +								//	Instead, we'll use this 'uniform'
 																				// value for the entire shape
  'uniform mat4 u_MvpMatrix;\n' +
  'uniform mat4 u_ModelMatrix;\n' + 		// Model matrix
  'uniform mat4 u_NormalMatrix;\n' +  	// Inverse Transpose of ModelMatrix;
  																			// (doesn't distort normal directions)
	'varying vec4 v_Kd; \n' +							// Phong: diffuse reflectance
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_Position;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
     // Calculate the vertex position & normal in the world coordinate system
     // and then save a 'varying', so that fragment shader will get per-pixel
     // values (interpolated between vertices of our drawing prim. (triangle).
  '  v_Position = vec3(u_ModelMatrix * a_Position);\n' +
  '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
//  '  v_Kd = vec4(u_Kd.rgb, 1.0); \n' + 	// diffuse reflectance
	'  v_Kd = vec4(0.0, 1.0, 0.0, 1.0); \n' + // TEMP; fixed at green
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  // first light source:
  'uniform vec3 u_Lamp0Pos;\n' + 			// Phong Illum: position
  'uniform vec3 u_Lamp0Amb;\n' +   		// Phong Illum: ambient
  'uniform vec3 u_Lamp0Diff;\n' +     // Phong Illum: diffuse
	'uniform vec3 u_Lamp0Spec;\n' +			// Phong Illum: specular
	// YOU write a second one...
//  'uniform vec3 u_Ke;\n' +							// Phong Reflectance: emissive
//  'uniform vec3 u_Ka;\n' +							// Phong Reflectance: ambient
//  'uniform vec3 u_Kd;\n' +							// Phong Reflectance: diffuse
//  'uniform vec3 u_Ks;\n' +							// Phong Reflectance: specular
//  'uniform int u_Kshiny;\n' +						// Phong Reflectance: 1 < shiny < 200	

  'varying vec3 v_Normal;\n' +				// Find 3D surface normal at each pix
  'varying vec3 v_Position;\n' +			// and 3D position too -- in 'world' coords
  'varying vec4 v_Kd;	\n' +						// Find diffuse reflectance K_d per pix
  																		// Ambient? Emissive? Specular? almost
  																		// NEVER change per-vertex: I use'uniform'
  'void main() {\n' +
     // Normalize the normal because it is interpolated and not 1.0 in length any more
  '  vec3 normal = normalize(v_Normal);\n' +
     // Calculate the light direction and make it 1.0 in length
  '  vec3 lightDirection = normalize(u_Lamp0Pos - v_Position);\n' +
     // The dot product of the light direction and the normal
  '  float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
     // Calculate the final color from diffuse reflection and ambient reflection
  '	 vec3 emissive = vec3(0,0,0);' +
  '  vec3 ambient = u_Lamp0Amb * v_Kd.rgb;\n' +
  '  vec3 diffuse = u_Lamp0Diff * v_Kd.rgb * nDotL;\n' +
  '  gl_FragColor = vec4(emissive + ambient + diffuse, 1.0);\n' +
  '}\n';

//Camera variables
var g_CamX = 0.00;
var g_CamY = 0.00;
var g_CamZ = 4.25;
var angle = 0.00;
var height = g_CamY;
var camPos = new Float32Array([g_CamX, g_CamY, g_CamZ]);
var lookAt = new Float32Array([0.0, 0.0, 0.0]);
var moveDirVec = new Float32Array([0.0, 0.0, 0.0]);
var directionVec = new Float32Array([0.0, 0.0, 0.0]);
var lookPos = new Float32Array([0, 0, 0]);

function main() {
    // Retrieve <canvas> element
    var canvas = document.getElementById('webgl');
    canvas.width = innerWidth;
    canvas.height = innerHeight;

    // Get the rendering context for WebGL
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // 
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
    }

    // Set the clear color and enable the depth test
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // Get the storage locations of uniform variables: for matrices
    var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    if (!u_ModelMatrix || !u_MvpMatrix || !u_NormalMatrix) {
        console.log('Failed to get matrix storage locations');
        return;
    }
    //  ... for Phong light source:
    var u_Lamp0Pos = gl.getUniformLocation(gl.program, 'u_Lamp0Pos');
    var u_Lamp0Amb = gl.getUniformLocation(gl.program, 'u_Lamp0Amb');
    var u_Lamp0Diff = gl.getUniformLocation(gl.program, 'u_Lamp0Diff');
    var u_Lamp0Spec = gl.getUniformLocation(gl.program, 'u_Lamp0Spec');
    if (!u_Lamp0Pos || !u_Lamp0Amb) {//|| !u_Lamp0Diff	) { // || !u_Lamp0Spec	) {
        console.log('Failed to get the Lamp0 storage locations');
        return;
    }
    // ... for Phong material/reflectance:
    //	var u_Ke = gl.getUniformLocation(gl.program, 'u_Ke');
    //	var u_Ka = gl.getUniformLocation(gl.program, 'u_Ka');
    var u_Kd = gl.getUniformLocation(gl.program, 'u_Kd');
    //	var u_Ks = gl.getUniformLocation(gl.program, 'u_Ks');
    //	var u_Kshiny = gl.getUniformLocation(gl.program, 'u_Kshiny');

    if (//!u_Ke || !u_Ka || 
		 !u_Kd
        //		 || !u_Ks || !u_Kshiny
		 ) {
        console.log('Failed to get the Phong Reflectance storage locations');
    }

    var modelMatrix = new Matrix4();  // Model matrix
    var mvpMatrix = new Matrix4();    // Model view projection matrix
    var normalMatrix = new Matrix4(); // Transformation matrix for normals

    // Calculate the model matrix
    modelMatrix.setRotate(90, 0, 1, 0); // Rotate around the y-axis

    // Calculate the view projection matrix
    mvpMatrix.setPerspective(30, canvas.width / canvas.height, 1, 100);

    var tick = function () {
        //animate();
        draw(gl, u_ModelMatrix, modelMatrix, u_MvpMatrix, mvpMatrix, u_NormalMatrix, normalMatrix,
        u_Lamp0Pos, u_Lamp0Amb, u_Lamp0Diff, u_Lamp0Spec, u_Kd, n);
        requestAnimationFrame(tick, canvas);
    }

    tick();
}

function draw(gl, u_ModelMatrix, modelMatrix, u_MvpMatrix, mvpMatrix, u_NormalMatrix, normalMatrix,
    u_Lamp0Pos, u_Lamp0Amb, u_Lamp0Diff, u_Lamp0Spec, u_Kd, n) {

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Position the first light source in World coords: 
        gl.uniform3f(u_Lamp0Pos, camPos[0], camPos[1], camPos[2]);        // was 5.0, 8.0, 7.0
    // Set its light output:  
        gl.uniform3f(u_Lamp0Amb, 0.0, 0.0, 0.0);		// ambient
        gl.uniform3f(u_Lamp0Diff, 0.8, 0.8, 0.8);		// diffuse
        gl.uniform3f(u_Lamp0Spec, 0.0, 0.9, 0.0);		// Specular

    // Set the Phong materials' reflectance:
    //	gl.uniform4f(u_Ke, 0.1, 0.1, 0.1);		// Ke emissive
    //	gl.uniform4f(u_Ka, 0.8, 0.8, 0.8);		// Ka ambient
        gl.uniform4f(u_Kd, 0.0, 1.0, 0.0, 1.0);		// Kd	diffuse
    //	gl.uniform4f(u_Ks, 0.7, 0.7, 0.7);		// Ks specular
    //	gl.uniform1i(u_Kshiny, 4);						// Kshiny shinyness exponent

        mvpMatrix.lookAt(0, 0, 6, 				// eye
                         0, 0, 0, 				// aim-point
                         0, 1, 0);				// up.
        mvpMatrix.multiply(modelMatrix);
    // Calculate the matrix to transform the normal based on the model matrix
        normalMatrix.setInverseOf(modelMatrix);
        normalMatrix.transpose();

    // Pass the model matrix to u_ModelMatrix
        gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    // Pass the model view projection matrix to u_mvpMatrix
        gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

    // Pass the transformation matrix for normals to u_NormalMatrix
        gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    // Clear color and depth buffer
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Draw the cube
        gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);

}

function initVertexBuffers(gl) { // Create a sphere
    var SPHERE_DIV = 13;

    var i, ai, si, ci;
    var j, aj, sj, cj;
    var p1, p2;

    var positions = [];
    var indices = [];

    // Generate coordinates
    for (j = 0; j <= SPHERE_DIV; j++) {
        aj = j * Math.PI / SPHERE_DIV;
        sj = Math.sin(aj);
        cj = Math.cos(aj);
        for (i = 0; i <= SPHERE_DIV; i++) {
            ai = i * 2 * Math.PI / SPHERE_DIV;
            si = Math.sin(ai);
            ci = Math.cos(ai);

            positions.push(si * sj);  // X
            positions.push(cj);       // Y
            positions.push(ci * sj);  // Z
        }
    }

    // Generate indices
    for (j = 0; j < SPHERE_DIV; j++) {
        for (i = 0; i < SPHERE_DIV; i++) {
            p1 = j * (SPHERE_DIV + 1) + i;
            p2 = p1 + (SPHERE_DIV + 1);

            indices.push(p1);
            indices.push(p2);
            indices.push(p1 + 1);

            indices.push(p1 + 1);
            indices.push(p2);
            indices.push(p2 + 1);
        }
    }

    // Write the vertex property to buffers (coordinates and normals)
    // Same data can be used for vertex and normal
    // In order to make it intelligible, another buffer is prepared separately
    if (!initArrayBuffer(gl, 'a_Position', new Float32Array(positions), gl.FLOAT, 3)) return -1;
    if (!initArrayBuffer(gl, 'a_Normal', new Float32Array(positions), gl.FLOAT, 3)) return -1;

    // Unbind the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // Write the indices to the buffer object
    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    return indices.length;
}

function initArrayBuffer(gl, attribute, data, type, num) {
    // Create a buffer object
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return false;
    }
    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    // Assign the buffer object to the attribute variable
    var a_attribute = gl.getAttribLocation(gl.program, attribute);
    if (a_attribute < 0) {
        console.log('Failed to get the storage location of ' + attribute);
        return false;
    }
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    // Enable the assignment of the buffer object to the attribute variable
    gl.enableVertexAttribArray(a_attribute);

    return true;
}
