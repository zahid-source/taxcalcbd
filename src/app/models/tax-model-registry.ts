import {AY, AY_VALUE, TaxModel} from './model';
import {TAX_MODEL_25_26} from './ay25-26.model';
import {TAX_MODEL_26_27} from './ay26-27.model';
import {TAX_MODEL_28_29} from './ay28-29.model';
import {TAX_MODEL_30_31} from './ay30-31.model';

/**
 * Assessment years that share a rule set point at the same model, so a
 * selection made on one carries over to the other.
 */
export const TAX_MODELS: Record<AY_VALUE, TaxModel> = {
  [AY.AY_2025_2026]: TAX_MODEL_25_26,
  [AY.AY_2026_2027]: TAX_MODEL_26_27,
  [AY.AY_2027_2028]: TAX_MODEL_26_27,
  [AY.AY_2028_2029]: TAX_MODEL_28_29,
  [AY.AY_2029_2030]: TAX_MODEL_28_29,
  [AY.AY_2030_2031]: TAX_MODEL_30_31
};

export function taxModelOf(ay: AY_VALUE): TaxModel {
  const model = TAX_MODELS[ay];
  if (!model) throw new Error('Unsupported AY: ' + ay);
  return model;
}
