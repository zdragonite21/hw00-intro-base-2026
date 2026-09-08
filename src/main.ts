import { vec3 } from "gl-matrix";
import Stats from "stats-js";
import * as DAT from "dat.gui";
import Icosphere from "./geometry/Icosphere";
import Square from "./geometry/Square";
import Cube from "./geometry/Cube";
import OpenGLRenderer from "./rendering/gl/OpenGLRenderer";
import Camera from "./Camera";
import { setGL } from "./globals";
import ShaderProgram, { Shader } from "./rendering/gl/ShaderProgram";
import { vec4 } from "gl-matrix";

import lambertVertSource from "./shaders/lambert-vert.glsl?raw";
import lambertFragSource from "./shaders/lambert-frag.glsl?raw";

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  tesselations: 5,
  color: "#FF0000",
  "Load Scene": loadScene, // A function pointer, essentially
};

let icosphere: Icosphere;
let square: Square;
let cube: Cube;
let prevTesselations: number = 5;

function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations);
  icosphere.create();
  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();
  cube = new Cube(vec3.fromValues(0, 0, 0));
  cube.create();
}

function hexToRGB(hex: string): [number, number, number] {
  hex = hex.replace("#", "");

  const red = parseInt(hex.slice(0, 2), 16) / 255;
  const green = parseInt(hex.slice(2, 4), 16) / 255;
  const blue = parseInt(hex.slice(4, 6), 16) / 255;

  return [red, green, blue];
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = "absolute";
  stats.domElement.style.left = "0px";
  stats.domElement.style.top = "0px";
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, "tesselations", 0, 8).step(1);
  gui.addColor(controls, "color");
  gui.add(controls, "Load Scene");

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement>document.getElementById("canvas");
  const gl = <WebGL2RenderingContext>canvas.getContext("webgl2");
  if (!gl) {
    alert("WebGL 2 not supported!");
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, lambertVertSource),
    new Shader(gl.FRAGMENT_SHADER, lambertFragSource),
  ]);

  let frame = 0;

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    if (controls.tesselations != prevTesselations) {
      prevTesselations = controls.tesselations;
      icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, prevTesselations);
      icosphere.create();
    }

    let color_rgb = hexToRGB(controls.color);
    renderer.render(
      camera,
      lambert,
      [
        // icosphere,
        cube,
        // square,
      ],
      vec4.fromValues(color_rgb[0], color_rgb[1], color_rgb[2], 1.0),
      frame,
    );
    stats.end();

    frame++;

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener(
    "resize",
    function () {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.setAspectRatio(window.innerWidth / window.innerHeight);
      camera.updateProjectionMatrix();
    },
    false,
  );

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();
}

main();
