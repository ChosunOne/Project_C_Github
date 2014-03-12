

var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Normal;\n' +
  'uniform vec3 u_Kd;\n' +																	

  'uniform mat4 u_MvpMatrix;\n' +
  'uniform mat4 u_ModelMatrix;\n' + 		
  'uniform mat4 u_NormalMatrix;\n' +  		
  'varying vec4 v_Kd; \n' +							

  'varying vec3 v_Normal;\n' +
  'varying vec3 v_Position;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
     
  '  v_Position = vec3(u_ModelMatrix * a_Position);\n' +
  '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +

	'  v_Kd = vec4(1.0, 1.0, 1.0, 1.0); \n'	+ 

  '}\n';


var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  
  'uniform vec3 u_Lamp0Pos;\n' + 			
  'uniform vec3 u_Lamp0Amb;\n' +   		
  'uniform vec3 u_Lamp0Diff;\n' +     
  'uniform vec3 u_Lamp0Spec;\n' +			

  'uniform vec3 u_Lamp1Pos;\n' + 			
  'uniform vec3 u_Lamp1Amb;\n' +   		
  'uniform vec3 u_Lamp1Diff;\n' +     
  'uniform vec3 u_Lamp1Spec;\n' +

  'varying vec3 v_Normal;\n' +				
  'varying vec3 v_Position;\n' +			
  'varying vec4 v_Kd;	\n' +						
  																		
  'void main() {\n' +
     
  '  vec3 normal = normalize(v_Normal);\n' +
     
  '  vec3 lightDirection0 = normalize(u_Lamp0Pos - v_Position);\n' +
  '	 vec3 lightDirection1 = normalize(u_Lamp1Pos - v_Position);\n' +
     
  '  float nDotL0 = max(dot(lightDirection0, normal), 0.0);\n' +
  '  float nDotL1 = max(dot(lightDirection1, normal), 0.0);\n' +
     
 
  '	 vec3 emissive = vec3(0,0,0);\n' +
  '  vec3 ambient = (u_Lamp0Amb * v_Kd.rgb) + (u_Lamp1Amb * v_Kd.rgb);\n' +
  '  vec3 diffuse = (u_Lamp0Diff * v_Kd.rgb * nDotL0) + (u_Lamp1Diff * v_Kd.rgb * nDotL1);\n' +
 
  '  gl_FragColor = vec4(emissive + ambient + diffuse, 1.0);\n' +
  '}\n';

  var floatsPerVertex = 6;
  var leanRate = 2.0;
  var lean = 0.0;
  var ar = innerWidth / innerHeight;
  var lamp = new Float32Array([0.0, 0.0, 0.0]);
  var tarLamp = new Float32Array([0.0, 0.0, 0.0]);

function main() {
  
  var canvas = document.getElementById('webgl');

  canvas.width = innerWidth;
  canvas.height = innerHeight;

  
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  var u_MvpMatrix = gl.getUniformLocation(gl.program, 	'u_MvpMatrix');
  var u_NormalMatrix = gl.getUniformLocation(gl.program,'u_NormalMatrix');
  if (!u_ModelMatrix	|| !u_MvpMatrix || !u_NormalMatrix) {
  	console.log('Failed to get matrix storage locations');
  	return;
  	}
	
  var u_Lamp0Pos  = gl.getUniformLocation(gl.program, 	'u_Lamp0Pos');
  var u_Lamp0Amb  = gl.getUniformLocation(gl.program, 	'u_Lamp0Amb');
  var u_Lamp0Diff = gl.getUniformLocation(gl.program, 	'u_Lamp0Diff');
  var u_Lamp0Spec = gl.getUniformLocation(gl.program,	'u_Lamp0Spec');
  var u_Lamp1Pos  = gl.getUniformLocation(gl.program, 	'u_Lamp1Pos');
  var u_Lamp1Amb  = gl.getUniformLocation(gl.program, 	'u_Lamp1Amb');
  var u_Lamp1Diff = gl.getUniformLocation(gl.program, 	'u_Lamp1Diff');
  var u_Lamp1Spec = gl.getUniformLocation(gl.program,	'u_Lamp1Spec');
  if( !u_Lamp0Pos || !u_Lamp0Amb	) {
    console.log('Failed to get the Lamp0 storage locations');
    return;
  }
	
	var u_Kd = gl.getUniformLocation(gl.program, 'u_Kd');
	var u_Ks = gl.getUniformLocation(gl.program, 'u_Ks');

	
	if(!u_Kd || !u_Ks ) {
		console.log('Failed to get the Phong Reflectance storage locations');
	}

	document.onkeydown = function (ev) { keydown(ev); };
  
  gl.uniform3f(u_Lamp0Amb, 0.0, 0.0, 0.0);		
  gl.uniform3f(u_Lamp0Diff, 0.8, 0.8, 0.8);		
  gl.uniform3f(u_Lamp0Spec, 0.0, 0.9, 0.0);		

  gl.uniform3f(u_Lamp1Amb, 0.0, 0.0, 0.0);		
  gl.uniform3f(u_Lamp1Diff, 0.8, 0.8, 0.8);		
  gl.uniform3f(u_Lamp1Spec, 0.0, 0.9, 0.0);		

	gl.uniform4f(u_Kd, 0.0, 1.0, 0.0, 1.0);		
	gl.uniform4f(u_Ks, 0.7, 0.7, 0.7, 1.0);		

  var modelMatrix = new Matrix4();  
  var mvpMatrix = new Matrix4();    
  var normalMatrix = new Matrix4(); 

  var tick = function() {

      animate()
      for (i=0; i<3; i++){
      	camPos[i] = 0.05 * (tarCamPos[i] - camPos[i]) + camPos[i];
      	lookPos[i] = 0.05 * (tarLookPos[i] - lookPos[i]) + lookPos[i];
      	lamp[i] = 0.05 * (tarLamp[i] - lamp[i]) + lamp[i];
      }
      gl.uniform3f(u_Lamp1Pos, lamp[0], lamp[1], lamp[2]);
      gl.uniform3f(u_Lamp0Pos, camPos[0], camPos[1], camPos[2]);
      draw(gl, canvas, u_MvpMatrix, mvpMatrix, u_ModelMatrix, modelMatrix, u_NormalMatrix, normalMatrix, n);
      requestAnimationFrame(tick, canvas);

  }
  
  tick();
}

function animate() {
    var now = Date.now();
    lean = leanRate * Math.sin(now / 1000);
}

function keydown(ev) {

    if (ev.keyCode == 39) {
        angle += 0.03;
    } else
        if (ev.keyCode == 37) {
            angle -= 0.03;
        } else
            if (ev.keyCode == 38) {
                height += 0.03;
            } else
                if (ev.keyCode == 40) {
                    height -= 0.03;
                }
    if (ev.keyCode == 87) { 
        moveDirVec = findDirectionVector(tarCamPos, tarLookPos)
        moveInDirection(moveDirVec);
    } else
        if (ev.keyCode == 83) { 
            moveDirVec = findDirectionVector(tarCamPos, tarLookPos);
            for (k = 0; k < 3; k++) {
                moveDirVec[k] = moveDirVec[k] * -1;
            }
            moveInDirection(moveDirVec);
        } else
            if (ev.keyCode == 65) { 
                moveDirVec = findDirectionVector(tarCamPos, tarLookPos);
                moveDirVec = findHorizTransVector(moveDirVec);
                for (k = 0; k < 3; k++) {
                    moveDirVec[k] = moveDirVec[k] * -1;
                }
                moveInDirection(moveDirVec);
            } else
                if (ev.keyCode == 68) { 
                    moveDirVec = findDirectionVector(tarCamPos, tarLookPos);
                    moveDirVec = findHorizTransVector(moveDirVec);
                    moveInDirection(moveDirVec);
                }
    if (ev.keyCode == 32) { 
        moveDirVec = new Float32Array([0, 1, 0]);
        moveInDirection(moveDirVec);
    } else
        if (ev.keyCode == 17) { 
            moveDirVec = new Float32Array([0, -1, 0]);
            moveInDirection(moveDirVec);
        }
}


var g_CamX = 0.00;
var g_CamY = 0.00;
var g_CamZ = 10.0;
var angle = 0.00;
var height = 0;
var camPos = new Float32Array([g_CamX, g_CamY, g_CamZ]);

var moveDirVec = new Float32Array([0.0, 0.0, 0.0]);
var directionVec = new Float32Array([0.0, 0.0, 0.0]);
var lookPos = new Float32Array([0, 0, 0]);
var tarLookPos = new Float32Array([0, 0, 0]);
var tarCamPos = new Float32Array([g_CamX, g_CamY, g_CamZ]);

function findDirectionVector(camPoint, lookPoint) {

    for (k = 0; k < 3; k++) {
        directionVec[k] = lookPoint[k] - camPoint[k];
    }
    return directionVec;
}

function findHorizTransVector(direction) {
    var directVec = new Float32Array([0.0, 0.0, 0.0]);
    directVec[1] = g_CamY;
    directVec[0] = direction[2] * -1;
    directVec[2] = direction[0];

    return directVec;
}

function moveInDirection(direction) {
    var step = .05;
    for (k = 0; k < 3; k++) {
        tarCamPos[k] += direction[k] * step;
    }
}

function rotateCam(theta, height, camX, camY, camZ) {
    var lookX;
    var lookY;
    var lookZ;
    var radius;

    radius = 5;

    lookX = camX + Math.cos(theta) * radius;
    lookY = camY + height;
    lookZ = camZ + Math.sin(theta) * radius;

    tarLookPos[0] = lookX;
    tarLookPos[1] = lookY;
    tarLookPos[2] = lookZ;

    console.log('Looking at ', tarLookPos[0], tarLookPos[1], tarLookPos[2]);
}

function draw(gl, canvas, u_MvpMatrix, mvpMatrix, u_ModelMatrix, modelMatrix, u_NormalMatrix, normalMatrix, n){
	
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      modelMatrix.setRotate(90, 1, 0, 0); 
      
      modelMatrix.translate(0, 0, 1);
      var groundMatrix = new Matrix4();
      groundMatrix.set(mvpMatrix);

      drawPyramid(gl, u_MvpMatrix, mvpMatrix, 25, 1, 1, lean, 6, 36);

      mvpMatrix.translate(10, 0, 0);

      drawPyramid(gl, u_MvpMatrix, mvpMatrix, 10, 2, 3, -1 * lean, 6, 36);

      mvpMatrix.translate(0, 10, 0);

      drawPyramid(gl, u_MvpMatrix, mvpMatrix, 4, .5, .5, lean, 6, 36);

      mvpMatrix.set(groundMatrix);

      mvpMatrix.setPerspective(30, ar, 1, 100);

	  rotateCam(angle, height, tarCamPos[0], tarCamPos[1], tarCamPos[2]);	

      mvpMatrix.lookAt(camPos[0], camPos[1], camPos[2],        
                    lookPos[0], lookPos[1], lookPos[2],        
                    0, 1, 0);       
      mvpMatrix.multiply(modelMatrix);
      
      normalMatrix.setInverseOf(modelMatrix);
      normalMatrix.transpose();

      try{
      	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  	  }
  	  catch(err){
  	  	console.log('Error from line 319');
  	  }

      
      try{
      	gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
  	  }
  	  catch(err){
  	  	console.log('Error from line 327');
  	  }

      
      try{
      	gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  	  }
  	  catch(err){
  	  	console.log('Error from line 335');
  	  }

  	  
      gl.drawArrays(gl.LINES,
                    groundStart / floatsPerVertex,
                    gridVerts.length / floatsPerVertex);
}


function drawGround() {

    var xlines = 1000; 
    var ylines = 1000; 
    var xygrid = 500;  
    
    var xColor = new Float32Array([0.0, 0.0, -1.0]);
    var yColor = new Float32Array([0.0, 0.0, -1.0]);

    gridVerts = new Float32Array(floatsPerVertex * 2 * (xlines + ylines));

    var xSpace = xygrid / (xlines - 1);
    var ySpace = xygrid / (ylines - 1);

    for (v = 0, j = 0; v < 2 * xlines; v++, j += floatsPerVertex) {
        if (v % 2 == 0) {
            gridVerts[j] = -xygrid + (v) * xSpace;
            gridVerts[j + 1] = -xygrid;
            gridVerts[j + 2] = 0.0;
        }
        else {
            gridVerts[j] = -xygrid + (v - 1) * xSpace;
            gridVerts[j + 1] = xygrid;
            gridVerts[j + 2] = 0.0;
        }
        gridVerts[j + 3] = xColor[0];
        gridVerts[j + 4] = xColor[1];
        gridVerts[j + 5] = xColor[2];
    }

    for (v = 0; v < 2 * ylines; v++, j += floatsPerVertex) {
        if (v % 2 == 0) {
            gridVerts[j] = -xygrid;
            gridVerts[j + 1] = -xygrid + (v) * ySpace;
            gridVerts[j + 2] = 0.0;
        }
        else {
            gridVerts[j] = xygrid;
            gridVerts[j + 1] = -xygrid + (v - 1) * ySpace;
            gridVerts[j + 2] = 0.0;
        }
        gridVerts[j + 3] = yColor[0];
        gridVerts[j + 4] = yColor[1];
        gridVerts[j + 5] = yColor[2];
    }
}

function drawFace(gl, u_ModelMatrix, modelMatrix, vertStart, vertEnd) {
	
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLES,
                    vertStart, 
                    vertEnd); 
}

function drawCube(gl, myu_ViewMatrix, myViewMatrix, scale, vertStart, vertEnd) {
    
    var cubeVM = new Matrix4();
    cubeVM.set(myViewMatrix);

    
    cubeVM.scale(scale, scale, scale);

    gl.uniformMatrix4fv(myu_ViewMatrix, false, cubeVM.elements);
    gl.drawArrays(gl.TRIANGLES,
    				vertStart,
    				vertEnd);
}

function drawScaledCube(myGL, myu_ViewMatrix, myViewMatrix, scaleX, scaleY, scaleZ, vertStart, vertEnd) {
    var cubeVM = new Matrix4();
    cubeVM.set(myViewMatrix);

    cubeVM.scale(scaleX, scaleY, scaleZ);

    drawCube(myGL, myu_ViewMatrix, cubeVM, 1, vertStart, vertEnd);
}

function drawPyramid(myGL, myu_ViewMatrix, myViewMatrix, levels, startingSize, scale, rot, vertStart, vertEnd) {
    
    pyraVM = new Matrix4();
    pyraVM.set(myViewMatrix);
    pyraVM.scale(scale, scale, scale);


    for (i = 0; i < levels; i++) {
        myGL.drawArrays(myGL.LINES, 6, 6);
        drawScaledCube(myGL, myu_ViewMatrix, pyraVM, startingSize, 1, startingSize, vertStart, vertEnd);
        pyraVM.translate(0.0, 0.0, -0.8);
        pyraVM.rotate(rot, 1.0, 0.0, 0.0);
        pyraVM.scale(.8, .8, .8);
    }
}

function initVertexBuffers(gl) {

    shapesVerts = new Float32Array([

         1.0, 1.0, 0.0, 0.0, 0.0, -1.0,  
        -1.0, 1.0, 0.0, 0.0, 0.0, -1.0,  
        -1.0, -1.0, 0.0, 0.0, 0.0, -1.0,  

         1.0, 1.0, 0.0, 0.0, 0.0, -1.0,  
        -1.0, -1.0, 0.0, 0.0, 0.0, -1.0,  
         1.0, -1.0, 0.0, 0.0, 0.0, -1.0,  

         1.000000, 1.000000, 1.000000, 0.666646, 0.666646, 0.333323,	
		1.000000, 1.000000, -1.000000, 0.408246, 0.408246, -0.816492,
		-1.000000, 1.000000, -1.000000, -0.408246, 0.816492, -0.408246,

		1.000000, 1.000000, 1.000000, 0.666646, 0.666646, 0.333323,
		-1.000000, 1.000000, -1.000000, -0.408246, 0.816492, -0.408246,
		-1.000000, 1.000000, 1.000000, -0.666646, 0.333323, 0.666646,

		-1.000000, -1.000000, -1.000000, -0.577349, -0.577349, -0.577349,
		-1.000000, -1.000000, 1.000000, -0.577349, -0.577349, 0.577349,
		-1.000000, 1.000000, 1.000000, -0.666646, 0.333323, 0.666646,

		-1.000000, -1.000000, -1.000000, -0.577349, -0.577349, -0.577349,
		-1.000000, 1.000000, 1.000000, -0.666646, 0.333323, 0.666646,
		-1.000000, 1.000000, -1.000000, -0.408246, 0.816492, -0.408246,

		1.000000, -1.000000, -1.000000, 0.816492, -0.408246, -0.408246,
		1.000000, -1.000000, 1.000000, 0.333323, -0.666646, 0.666646,
		-1.000000, -1.000000, -1.000000, -0.577349, -0.577349, -0.577349,

		1.000000, -1.000000, 1.000000, 0.333323, -0.666646, 0.666646,
		-1.000000, -1.000000, 1.000000, -0.577349, -0.577349, 0.577349,
		-1.000000, -1.000000, -1.000000, -0.577349, -0.577349, -0.577349,

		1.000000, 1.000000, -1.000000, 0.408246, 0.408246, -0.816492,
		1.000000, 1.000000, 1.000000, 0.666646, 0.666646, 0.333323,
		1.000000, -1.000000, -1.000000, 0.816492, -0.408246, -0.408246,

		1.000000, 1.000000, 1.000000, 0.666646, 0.666646, 0.333323,
		1.000000, -1.000000, 1.000000, 0.333323, -0.666646, 0.666646,
		1.000000, -1.000000, -1.000000, 0.816492, -0.408246, -0.408246,

		1.000000, 1.000000, 1.000000, 0.666646, 0.666646, 0.333323,
		-1.000000, 1.000000, 1.000000, -0.666646, 0.333323, 0.666646,
		1.000000, -1.000000, 1.000000, 0.333323, -0.666646, 0.666646,

		-1.000000, 1.000000, 1.000000, -0.666646, 0.333323, 0.666646,
		-1.000000, -1.000000, 1.000000, -0.577349, -0.577349, 0.577349,
		1.000000, -1.000000, 1.000000, 0.333323, -0.666646, 0.666646,

		1.000000, 1.000000, -1.000000, 0.408246, 0.408246, -0.816492,
		1.000000, -1.000000, -1.000000, 0.816492, -0.408246, -0.408246,
		-1.000000, -1.000000, -1.000000, -0.577349, -0.577349, -0.577349,

		1.000000, 1.000000, -1.000000, 0.408246, 0.408246, -0.816492,
		-1.000000, -1.000000, -1.000000, -0.577349, -0.577349, -0.577349,
		-1.000000, 1.000000, -1.000000, -0.408246, 0.816492, -0.408246,

         0.0, 0.0, 0.0, 
         1.3, 0.0, 0.0, 

         0.0, 0.0, 0.0, 
         0.0, 1.3, 0.0, 

         0.0, 0.0, 0.0, 
         0.0, 0.0, 1.3, 

         1.0, 1.0, 0.0, 
        -1.0, 1.0, 0.0, 
        -1.0, -1.0, 0.0, 

         1.0, 1.0, 0.0, 
        -1.0, -1.0, 0.0, 
         1.0, -1.0, 0.0, 

         1.0, 1.0, 0.0, 
        -1.0, 1.0, 0.0, 
        -1.0, -1.0, 0.0, 

         1.0, 1.0, 0.0, 
        -1.0, -1.0, 0.0, 
         1.0, -1.0, 0.0 
    ]);

    drawGround();

    size = shapesVerts.length + gridVerts.length;

    var nn = size / floatsPerVertex;
    console.log('nn is', nn, 'size is', size, 'floatsPerVertex is', floatsPerVertex);

    var verticesColors = new Float32Array(size);

    for (i = 0, j = 0; j < shapesVerts.length; i++, j++) {
        verticesColors[i] = shapesVerts[j];
    }

    groundStart = i;

    for (j = 0; j < gridVerts.length; i++, j++) {
        verticesColors[i] = gridVerts[j];
    }

    var vertexColorBuffer = gl.createBuffer();
    if (!vertexColorBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

    var FSIZE = verticesColors.BYTES_PER_ELEMENT;
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }

    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
    gl.enableVertexAttribArray(a_Position);

    var a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
    if (a_Normal < 0) {
        console.log('Failed to get the storage location of a_Normal');
        return -1;
    }

    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
    gl.enableVertexAttribArray(a_Normal);

    return size / floatsPerVertex;
}

function initArrayBuffer(gl, attribute, data, type, num) {
  
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  
  gl.enableVertexAttribArray(a_attribute);

  return true;
}

function moveLampX(){
	tarLamp[0] += 1;
}

function moveLampXN(){
	tarLamp[0] -= 1;
}

function moveLampY(){
	tarLamp[1] += 1;
}

function moveLampYN(){
	tarLamp[1] -= 1;
}

function moveLampZ(){
	tarLamp[2] += 1;
}

function moveLampZN(){
	tarLamp[2] -= 1;
}
