import { NodeCircleProgram } from 'sigma/rendering';

// Diamond node program for Sigma.js — identical to NodeCircleProgram but the
// fragment shader uses the L1 distance (|x|+|y|) instead of L2 (sqrt(x²+y²)),
// which clips the circle into a ◆ diamond shape aligned to the axes.
export class NodeDiamondProgram extends NodeCircleProgram {
  getDefinition() {
    const def = super.getDefinition();
    return {
      ...def,
      FRAGMENT_SHADER_SOURCE: def.FRAGMENT_SHADER_SOURCE.replace(
        'float dist = length(v_diffVector) - v_radius + border;',
        'float dist = (abs(v_diffVector.x) + abs(v_diffVector.y)) - v_radius + border;',
      ),
    };
  }
}
