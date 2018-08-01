import { isOrbiting, wrapNumber, hexToRgb } from './_logic.js'

var THREE = require('three');
var findRoot = require('newton-raphson');

export function drawOrbit(scene, celestialObject, deltaT = 0, animationSpeed) {
  var meanAnomaly = getMeanAnomaly(celestialObject, deltaT, animationSpeed);
  var eccentricAnomaly = getEccentricAnomaly(celestialObject, meanAnomaly);
  var trueAnomaly = getTrueAnomaly(celestialObject, eccentricAnomaly);
  var radius = getRadius(celestialObject, trueAnomaly);
  var coordinates = orbitCoordinates(celestialObject, trueAnomaly, radius);
  var objectToDraw = scene.getObjectByName(celestialObject.name);

  // console.log(trueAnomaly);
  if (isOrbiting(celestialObject)) {
    //Fetch parent body center and use that as its center
    var parentBody = scene.getObjectByName(celestialObject.center);
    var pivot = new THREE.Object3D();
    objectToDraw.position.x = parentBody.position.x + coordinates.x;
    objectToDraw.position.y = parentBody.position.y + coordinates.y;
    objectToDraw.position.z = parentBody.position.z + coordinates.z;
  } else {
    // Draw orbit directly using orbit parameters
    objectToDraw.position.x = coordinates.x;
    objectToDraw.position.y = coordinates.y;
    objectToDraw.position.z = coordinates.z;
  }
}

//Time to get mathy

function getMeanAnomaly(celestialObject, deltaT, animationSpeed) {
  var meanAnomaly = parseFloat(celestialObject.mean_anomaly);
  var newMeanAnomaly = meanAnomaly + ((2 * Math.PI)/(celestialObject.period * (1/animationSpeed) )) * deltaT;
  return wrapNumber(newMeanAnomaly, 2 * Math.PI);
}

function getEccentricAnomaly(celestialObject, meanAnomaly) {
  var eccentricity = parseFloat(celestialObject.eccentricity);
  // Function and first and second derivatives to use the Newton-Raphson method to approximate a root
  function f(x){return x - eccentricity * Math.sin(x) - meanAnomaly;}
  function fp(x) {return 1 - eccentricity * Math.cos(x);}

  return wrapNumber(findRoot(f, fp, Math.PI), 2 * Math.PI);
}

function getTrueAnomaly(celestialObject, eccentricAnomaly) {
  var eccentricity = parseFloat(celestialObject.eccentricity);
  var trueAnomaly = 2 * Math.atan( Math.pow((1 + eccentricity)/(1 - eccentricity), 0.5 ) * Math.tan(eccentricAnomaly/2) );
  if (trueAnomaly < 0) {
    trueAnomaly = trueAnomaly + 2 * Math.PI;
    return trueAnomaly;
  } else {
    return trueAnomaly;
  }
}

function getRadius(celestialObject, trueAnomaly) {
  var semimajor_axis = parseFloat(celestialObject.semimajor_axis);
  var eccentricity = parseFloat(celestialObject.eccentricity);
  return ( semimajor_axis * (1 - Math.pow(eccentricity, 2)) )/( 1 + eccentricity * Math.cos(trueAnomaly) );
}

function orbitCoordinates(celestialObject, trueAnomaly, radius) {
  var true_anomaly = trueAnomaly;
  var longitude = parseFloat(celestialObject.longitude);
  var periapsis_arg = parseFloat(celestialObject.periapsis_arg);
  var inclination = parseFloat(celestialObject.inclination);

  var x = radius * ( Math.cos(longitude) * Math.cos(periapsis_arg + true_anomaly) - Math.sin(longitude) * Math.sin(periapsis_arg + true_anomaly) * Math.cos(inclination) );
  var y = radius * ( Math.sin(longitude) * Math.cos(periapsis_arg + true_anomaly) + Math.cos(longitude) * Math.sin(periapsis_arg + true_anomaly) * Math.cos(inclination) );
  var z = radius * ( Math.sin(inclination) * Math.sin(periapsis_arg + true_anomaly) );

  return {
    x: x,
    y: y,
    z: z
  }
}
