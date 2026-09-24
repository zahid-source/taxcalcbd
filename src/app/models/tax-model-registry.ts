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

export interface AyModelGroup {
  /** short legend label, e.g. 'AY 26-27, 27-28' */
  label: string;
  ays: AY_VALUE[];
  model: TaxModel;
}

/** Assessment years bundled by the rule set they share, in calendar order. */
export function ayModelGroups(): AyModelGroup[] {
  const groups: AyModelGroup[] = [];
  for (const ay of Object.values(AY)) {
    const model = TAX_MODELS[ay];
    const last = groups[groups.length - 1];
    if (last && last.model === model) {
      last.ays.push(ay);
    } else {
      groups.push({label: '', ays: [ay], model});
    }
  }
  for (const group of groups) {
    group.label = 'AY ' + group.ays.map(ay => shortAy(ay)).join(', ');
  }
  return groups;
}

/** '2026-2027' -> '26-27' */
function shortAy(ay: AY_VALUE): string {
  const [from, to] = String(ay).split('-');
  return from.slice(2) + '-' + to.slice(2);
}
