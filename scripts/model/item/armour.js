import { EquippedItemModel } from "./components/equipped";
import { TraitsModel } from "./components/traits";

let fields = foundry.data.fields;

export class ArmourModel extends EquippedItemModel
{
    static LOCALIZATION_PREFIXES = ["WH.Models.armour", "WH.Components.physical"];
    
    get traitsAvailable()
    {
        return game.wng.config.armourTraits;
    }

    static defineSchema() 
    {
        let schema = super.defineSchema();
        schema.rating = new fields.NumberField({min : 0});
        schema.base = new fields.NumberField({min : 0});
        schema.traits = new fields.EmbeddedDataField(TraitsModel);
        schema.invulnerable = new fields.BooleanField({});
        return schema;
    }

    getOtherEffects()
    {
        return super.getOtherEffects().concat(this.traits.effects);
    }

}