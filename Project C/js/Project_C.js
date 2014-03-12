// Vertex Shader

var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Normal;\n' +
    'attribute vec4 a_Color;\n' +

    'uniform vec3 u_Kd;' +
    'uniform mat4 u_ViewMatrix;\n' + //aka the ModelMatrix
    'uniform mat4 u_ProjMatrix;\n' + //aka the MvpMatrix
    'uniform mat4 u_NormalMatrix;\n' +

    'varying vec4 v_Color;\n' +
    'varying vec4 v_Kd;\n' +
    'varying vec3 v_Normal;\n' +
    'varying vec3 v_Position;\n' +

    'void main() {\n' +
    '   gl_Position = u_ProjMatrix * u_ViewMatrix * a_Position;\n' +
    '   v_Position = vec3(u_ViewMatrix * a_Position);\n' +
    '   v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
    '   v_Kd = vec4(u_Kd.rgb, 1.0);\n' +
    '   v_Color = a_Color;\n' +
    '}\n';

// Fragment Shader

var FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +

    'uniform vec3 u_Lamp0Pos;\n' +
    'uniform vec3 u_Lamp0Amb;\n' +
    'uniform vec3 u_Lamp0Diff;\n' +
    'uniform vec3 u_Lamp0Spec;\n' +

    'uniform vec3 u_Ke;\n' +
    'uniform vec3 u_Ka;\n' +
    //'uniform vec3 u_Kd;\n' +
    'uniform vec3 u_Ks;\n' +
    'uniform int u_Kshiny;\n' +

    'varying vec4 v_Color;\n' +
    'varying vec3 v_Normal;\n' +
    'varying vec3 v_Position;\n' +
    'varying vec4 v_Kd;\n' +

    'void main() {\n' +
    '   vec3 normal = normalize(v_Normal);\n' +
    '   vec3 lightDirection = normalize(u_Lamp0Pos - v_Position);\n' +
    '   float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
    '   vec3 emissive = vec3(0,0,0);' +
    '   vec3 ambient = u_Lamp0Amb * v_Kd.rgb;\n' +
    '   vec3 diffuse = u_Lamp0Diff * v_Kd.rgb * nDotL;\n' +
    '   gl_FragColor = vec4(emissive + ambient + diffuse, 1.0);\n' + // was gl_FragColor = v_Color;\n
    '}\n';

// Global Variables
var canvas;
var n;
var floatsPerVertex = 6;
var shapesStart = 0;
var shapesVerts = new Float32Array([
        0.0, 0.0, 0.0, 0.0, 0.0, 0.0
]);
var groundStart = 0;
var gridVerts = new Float32Array([]);
var ortho = false;
var lean;
var leanRate = 1.0;

function main() {

    canvas = document.getElementById('webgl');
    canvas.width = innerWidth;
    canvas.height = innerHeight;

    // Get rendering context
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders.');
        return;
    }

    // Initialize vertex buffer
    n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
    }

    // Set the clear color
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // Get storage locations for matrices
    var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
    var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    if (!u_ViewMatrix || !u_ProjMatrix || !u_NormalMatrix) {
        console.log('Failed to get the storage location of u_ViewMatrix or u_ProjMatrix or u_NormalMatrix');
        return;
    }

    var u_Lamp0Pos = gl.getUniformLocation(gl.program, 'u_Lamp0Pos');
    var u_Lamp0Amb = gl.getUniformLocation(gl.program, 'u_Lamp0Amb');
    var u_Lamp0Diff = gl.getUniformLocation(gl.program, 'u_Lamp0Diff');
    var u_Lamp0Spec = gl.getUniformLocation(gl.program, 'u_Lamp0Spec');
    if (!u_Lamp0Pos || !u_Lamp0Amb ) { //|| !u_Lamp0Diff || !u_Lamp0Spec) {
        console.log('Failed to get the Lamp0 storage locations');
        return;
    }

    var u_Kd = gl.getUniformLocation(gl.program, 'u_Kd');

    if (/*!u_Ke || !u_Ka ||*/ !u_Kd) {
        console.log('Failed to get the Phong reflections storage locations');
    }

    gl.uniform3f(u_Lamp0Pos, camPos[0], camPos[1], camPos[2]); // Lamp 0 Position
    gl.uniform3f(u_Lamp0Amb, 0.1, 0.1, 0.1); // Lamp 0 Ambient Level
    gl.uniform3f(u_Lamp0Diff, 0.8, 0.8, 0.8);// Lamp 0 Diffuse Level
    gl.uniform3f(u_Lamp0Spec, 0.0, 0.9, 0.0);// Lamp 0 Specular Level

    gl.uniform4f(u_Kd, 0.0, 1.0, 0.0, 1.0); // Kd diffuse

    var viewMatrix = new Matrix4();
    var projMatrix = new Matrix4();
    var orthoMatrix = new Matrix4();
    var normalMatrix = new Matrix4(); // Transformation matrix for normals


    document.onkeydown = function (ev) { keydown(ev, gl, u_ViewMatrix, viewMatrix); };

    viewMatrix.setRotate(90, 0, 1, 0);


    // Create the projection matrix

    orthoMatrix.setOrtho(-5.0 * canvas.width / canvas.height,
                         5.0 * canvas.width / canvas.height,
                         -5.0,
                         5.0,
                         0.0,
                         2000.0);

    projMatrix.setPerspective(45, canvas.width / canvas.height, 1, 100);

    projMatrix.multiply(viewMatrix);
    normalMatrix.setInverseOf(viewMatrix);
    normalMatrix.transpose()

    // Send matrices to shaders
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
    gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    // Draw on the screen


    var tick = function () {
        animate();
        draw(gl, u_ViewMatrix, viewMatrix, u_ProjMatrix, projMatrix, u_NormalMatrix, normalMatrix, orthoMatrix);
        requestAnimationFrame(tick, canvas);
    }

    tick();
}

function animate() {
    var now = Date.now();
    lean = leanRate * Math.sin(now / 1000);
}
// Draws the ground grid
function drawGround() {

    var xlines = 1000; // 100
    var ylines = 1000; // 100
    var xygrid = 500;  // 50
    //                              r    g    b
    var xColor = new Float32Array([0.2, 0.2, 0.2]);
    var yColor = new Float32Array([0.2, 0.1, 0.0]);

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

function initVertexBuffers(gl) {

    shapesVerts = new Float32Array([
//       x     y     z      r    g    b
         1.0, 1.0, 0.0, //0.5, 0.5, 0.5,  // Gray             0
        -1.0, 1.0, 0.0, //0.5, 0.5, 0.5,  // Gray             1
        -1.0, -1.0, 0.0, //0.5, 0.5, 0.5,  // Gray             2

         1.0, 1.0, 0.0, //1.0, 0.5, 0.0,  // Orange           3
        -1.0, -1.0, 0.0, //1.0, 0.5, 0.0,  // Orange           4
         1.0, -1.0, 0.0, //1.0, 0.5, 0.0,  // Orange           5

         0.0, 0.0, 0.0, //0.3, 0.3, 0.3,  // Drawing axis     6
         1.3, 0.0, 0.0, //1.0, 0.3, 0.3,  //                  7

         0.0, 0.0, 0.0, //0.3, 0.3, 0.3,  //                  8                
         0.0, 1.3, 0.0, //0.3, 1.0, 0.3,  //                  9

         0.0, 0.0, 0.0, //0.3, 0.3, 0.3,  //                  10
         0.0, 0.0, 1.3, //0.3, 0.3, 1.0,  //                  11

         1.0, 1.0, 0.0, //1.0, 1.0, 0.0,  // Yellow           12
        -1.0, 1.0, 0.0, //1.0, 0.7, 0.0,  // Orange           13
        -1.0, -1.0, 0.0, //1.0, 0.3, 0.0,  // Red-Orange       14

         1.0, 1.0, 0.0, //1.0, 1.0, 0.0,  // Yellow           15
        -1.0, -1.0, 0.0, //1.0, 0.7, 0.0,  // Orange           16
         1.0, -1.0, 0.0, //1.0, 0.3, 0.0,  // Red-Orange       17

         1.0, 1.0, 0.0, //1.0, 0.0, 1.0,  // Magenta          18
        -1.0, 1.0, 0.0, //0.4, 1.0, 0.3,  // ????             19
        -1.0, -1.0, 0.0, //0.7, 0.2, 0.4,  // ????             20

         1.0, 1.0, 0.0, //1.0, 1.0, 1.0,  // White            21
        -1.0, -1.0, 0.0, //0.0, 0.0, 0.0,  // Black            22
         1.0, -1.0, 0.0 //0.0, 0.3, 0.0   // Dark Yellow      23
    ]);

    // Draw the ground
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

    // Create buffer object
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

    var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    if (a_Color < 0) {
        console.log('Failed to get the storage location of a_Color');
        return -1;
    }

    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
    gl.enableVertexAttribArray(a_Color);

    return size / floatsPerVertex;
}

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

function keydown(ev, gl, u_ViewMatrix, viewMatrix) {

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
    if (ev.keyCode == 87) { // w
        moveDirVec = findDirectionVector(camPos, lookAt)
        moveInDirection(moveDirVec);
    } else
        if (ev.keyCode == 83) { // s
            moveDirVec = findDirectionVector(camPos, lookAt);
            for (k = 0; k < 3; k++) {
                moveDirVec[k] = moveDirVec[k] * -1;
            }
            moveInDirection(moveDirVec);
        } else
            if (ev.keyCode == 65) { // a
                moveDirVec = findDirectionVector(camPos, lookAt);
                moveDirVec = findHorizTransVector(moveDirVec);
                for (k = 0; k < 3; k++) {
                    moveDirVec[k] = moveDirVec[k] * -1;
                }
                moveInDirection(moveDirVec);
            } else
                if (ev.keyCode == 68) { //d
                    moveDirVec = findDirectionVector(camPos, lookAt);
                    moveDirVec = findHorizTransVector(moveDirVec);
                    moveInDirection(moveDirVec);
                }
    if (ev.keyCode == 32) { //spacebar
        moveDirVec = new Float32Array([0, 1, 0]);
        moveInDirection(moveDirVec);
    } else
        if (ev.keyCode == 17) { //control
            moveDirVec = new Float32Array([0, -1, 0]);
            moveInDirection(moveDirVec);
        } else
            if (ev.keyCode == 13) { //enter
                switchMode(gl);
            } else
                if (ev.keyCode == 70) { //f
                    leanRate = leanRate + 0.1;
                }
    if (ev.keyCode == 71) { //g
        leanRate = leanRate - 0.1;
    }
}

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
    var step = .1;
    for (k = 0; k < 3; k++) {
        camPos[k] += direction[k] * step;
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

    lookPos[0] = lookX;
    lookPos[1] = lookY;
    lookPos[2] = lookZ;

    console.log('Looking at ', lookPos[0], lookPos[1], lookPos[2]);

    return lookPos;
}

function draw(gl, u_ViewMatrix, viewMatrix, u_ProjMatrix, projMatrix, u_NormalMatrix, normalMatrix, orthoMatrix) {

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniformMatrix4fv(u_ProjMatrix, false, orthoMatrix.elements);

    // Draw the first viewport
    if (ortho) {
        gl.uniformMatrix4fv(u_ProjMatrix, false, orthoMatrix.elements);
    }
    else {
        gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
    }

    gl.viewport(0, 
                0, 
                gl.drawingBufferWidth,
                gl.drawingBufferHeight);

    // Find the look at point
    lookAt = rotateCam(angle, height, camPos[0], camPos[1], camPos[2]);

    viewMatrix.setLookAt(camPos[0], camPos[1], camPos[2], //example was g_CamX, g_CamY, g_CamZ, this is the camera in world coords.
                         lookAt[0], lookAt[1], lookAt[2],  //example was 0, 0, 0, this is the point being looked at
                         0, 1, 0); //example was 0, 1, 0, this is the up direction

    

    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

    drawScene(gl, u_ViewMatrix, viewMatrix, u_NormalMatrix, normalMatrix);
}

function drawScene(myGL, myu_ViewMatrix, myViewMatrix, myu_NormalMatrix, myNormalMatrix) {

    /*

    drawPyramid(myGL, myu_ViewMatrix, myViewMatrix, 10, 4, 0.5, lean, 0, 6);

    myViewMatrix.translate(5.0, 5.0, 0.0);
    drawScaledCube(myGL, myu_ViewMatrix, myViewMatrix, 0.1 * (lean + 5.0), 0.1 * (lean + 5.0), 0.1 * (lean + 5.0), 12, 6);
    myViewMatrix.translate(-5.0, -5.0, 0.0);
    myViewMatrix.translate(10.0, 0.0, 10.0);
    drawPyramid(myGL, myu_ViewMatrix, myViewMatrix, 5, 3, 0.6, 0, 18, 6);
    myViewMatrix.translate(10.0, 0.0, 5.0);
    drawRing(myGL, myu_ViewMatrix, myViewMatrix, 1, 5, 6, 48);
    myViewMatrix.translate(0.0, 0.0, -15.0);
    drawRing(myGL, myu_ViewMatrix, myViewMatrix, .5, 7, 6, 13);

    */
    myViewMatrix.rotate(-90.0, 1, 0, 0);
    myViewMatrix.translate(0.0, 0.0, -0.6);
    myViewMatrix.scale(0.4, 0.4, 0.4);

    myNormalMatrix.setInverseOf(myViewMatrix);
    myNormalMatrix.transpose();

    myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
    myGL.drawArrays(myGL.LINES, 6, 6);
    myGL.drawArrays(myGL.LINES,
                    groundStart / floatsPerVertex,
                    gridVerts.length / floatsPerVertex);

}

function drawFace(myGL, myu_ViewMatrix, myViewMatrix, vertStart, vertEnd) {
    myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
    myGL.drawArrays(myGL.TRIANGLES,
                    vertStart, // shapesStart / floatsPerVertex
                    vertEnd); // shapesVerts.length / floatsPerVertex
}

function drawCube(myGL, myu_ViewMatrix, myViewMatrix, scale, vertStart, vertEnd) {
    //Save inital view matrix
    var cubeVM = new Matrix4();
    cubeVM.set(myViewMatrix);

    // Scale the cube
    cubeVM.scale(scale, scale, scale);

    // Draw the front face of the cube
    drawFace(myGL, myu_ViewMatrix, cubeVM, vertStart, vertEnd);

    // Draw the bottom face of the cube
    cubeVM.rotate(-90.0, 1, 0, 0);
    cubeVM.translate(0.0, 1.0, -1.0);
    drawFace(myGL, myu_ViewMatrix, cubeVM, vertStart, vertEnd);

    // Draw the rear face of the cube
    cubeVM.translate(0.0, 1.0, 1.0);
    cubeVM.rotate(90.0, 1, 0, 0);
    drawFace(myGL, myu_ViewMatrix, cubeVM, vertStart, vertEnd);

    // Draw the top face of the cube
    cubeVM.translate(0.0, 1.0, 1.0);
    cubeVM.rotate(-90.0, 1, 0, 0);
    drawFace(myGL, myu_ViewMatrix, cubeVM, vertStart, vertEnd);

    // Draw the left face of the cube
    cubeVM.translate(-1.0, 0.0, -1.0);
    cubeVM.rotate(90.0, 0, 1, 0);
    drawFace(myGL, myu_ViewMatrix, cubeVM, vertStart, vertEnd);

    // Draw the right face of the cube
    cubeVM.translate(0.0, 0.0, 2.0);
    drawFace(myGL, myu_ViewMatrix, cubeVM, vertStart, vertEnd);
}

function drawRing(myGL, myu_ViewMatrix, myViewMatrix, scale, vertStart, vertEnd, fidelity) {
    // Save inital view matrix
    var ringVM = new Matrix4();
    ringVM.set(myViewMatrix);

    // Scale the ring
    ringVM.scale(scale, scale, scale);

    // Calculate fidelity of ring
    angleStep = 360 / fidelity;
    angleStep2 = ((fidelity - 2) * 180.0) / fidelity

    for (k = 0; k < fidelity; k++) {
        drawFace(myGL, myu_ViewMatrix, ringVM, vertStart, vertEnd);
        ringVM.translate(0.0, 1.2, -1.0);
        ringVM.rotate(-1 * angleStep2, 1, 0, 0);

    }



}

function drawScaledCube(myGL, myu_ViewMatrix, myViewMatrix, scaleX, scaleY, scaleZ, vertStart, vertEnd) {
    var cubeVM = new Matrix4();
    cubeVM.set(myViewMatrix);

    cubeVM.scale(scaleX, scaleY, scaleZ);

    drawCube(myGL, myu_ViewMatrix, cubeVM, 1, vertStart, vertEnd);
}

function drawPyramid(myGL, myu_ViewMatrix, myViewMatrix, levels, startingSize, scale, rot, vertStart, vertEnd) {
    // Save the initial view matrix
    pyraVM = new Matrix4();
    pyraVM.set(myViewMatrix);
    pyraVM.scale(scale, scale, scale);


    for (i = 0; i < levels; i++) {
        myGL.drawArrays(myGL.LINES, 6, 6);
        drawScaledCube(myGL, myu_ViewMatrix, pyraVM, startingSize, 1, startingSize, vertStart, vertEnd);
        pyraVM.translate(0.0, 1.81, -0.8);
        pyraVM.rotate(rot, 1.0, 0.0, 0.0);
        pyraVM.scale(.8, .8, .8);
    }
}

function switchMode(gl, u_ViewMatrix, viewMatrix) {
    if (ortho) {
        ortho = false;
    } else {
        ortho = true;
    }
}