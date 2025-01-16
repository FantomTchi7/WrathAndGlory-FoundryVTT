import { AttackDialog } from "./attack-dialog.js";

export class WeaponDialog extends AttackDialog {


  get weapon() 
  {
    return this.data.weapon;
  }

  static async setupData(weapon, actor, options={})
  {
      if (typeof weapon == "string")
      {
        weapon = actor.items.get(weapon) || await fromUuid(weapon)
      }

      options.combi = weapon.system.combi.document ? await Dialog.confirm({title : "Combi-Weapons", content : "Fire both Combi-Weapons?"}) : false

      let skill = weapon.isMelee ? "weaponSkill" : "ballisticSkill"
      let attribute = weapon.getSkillFor(actor).attribute

      let dialogData = await super.setupData({skill, attribute}, actor, options)

      dialogData.data.item = weapon;
      dialogData.data.weapon = weapon;
      dialogData.data.scripts = dialogData.data.scripts.concat(weapon?.getScripts("dialog"));
      foundry.utils.setProperty(dialogData, "fields.ed.dice",  weapon.system.damage.ed.dice);
      foundry.utils.setProperty(dialogData, "fields.ap.dice",  weapon.system.damage.ap.dice);

      if (dialogData.data.targets[0])
      {
        let token = actor.getActiveTokens()[0]?.document
        let target = dialogData.data.targets[0];
        if (target && token)
        {
          dialogData.fields.distance = canvas.grid.measureDistances([{ ray: new Ray({ x: token.x, y: token.y }, { x: target.x, y: target.y }) }], { gridSpaces: true })[0]
        }
      }


      options.title = `${weapon.name} Test`

      return dialogData;
  }

  computeFields()
  {
    let weapon = this.weapon;

    this.tooltips.start(this)
    this.fields.pool += weapon.attack.base + weapon.attack.bonus
    this.fields.damage += weapon.system.damage.base + weapon.system.damage.bonus + (weapon.system.damage.rank * this.actor.system.advances?.rank || 0)
    this.fields.ed.value += weapon.system.damage.ed.base + weapon.system.damage.ed.bonus + (weapon.system.damage.ed.rank * this.actor.system.advances?.rank || 0)
    this.fields.ap.value += weapon.system.damage.ap.base + weapon.system.damage.ap.bonus + (weapon.system.damage.ap.rank * this.actor.system.advances?.rank || 0)

    if (weapon.isMelee) {
      this.fields.damage += this.actor.system.attributes.strength.total
    }
    this.tooltips.finish(this, "Weapon")


    // Aiming
    if (this.fields.aim)
    {
      this.fields.pool++;
      this.tooltips.add("pool", 1, game.i18n.localize("WEAPON.AIM"))
    }

    // Range
    this.tooltips.start(this)
    if (this.fields.range == "short")
    {
      this.fields.pool += 1
      if (this.weapon.traitList.rapidFire)
      {
        this.fields.ed.value += (parseInt(weapon.traitList.rapidFire.rating) || 0)
      }
      this.tooltips.finish(this, "Short Range")
    }
    else if (this.fields.range == "long")
    {
      this.fields.difficulty += 2
      this.tooltips.finish(this, "Long Range")
    }
    else 
    {
      this.tooltips.finish();
    }

    // Charging
    if (this.fields.charging)
    {
      this.fields.pool++;
      this.tooltips.add("pool", 1, game.i18n.localize("WEAPON.CHARGING"))
    }

    // Mob
    if (this.actor.isMob)
    {
      this.fields.pool += Math.ceil(this.actor.mob / 2)
      this.tooltips.add("pool", Math.ceil(this.actor.mob / 2), "Mob")
    }
  }

  computeInitialFields()
  {
    super.computeInitialFields();
    this.computeRange();
    this.computeTargets();
  }


  computeTargets()
  {
    if (this.data.targets[0])
    {
          let target = this.data.targets[0]

          if (target && target.actor)
          {
            this.fields.difficulty = target.actor.combat.defence.total
            this.tooltips.set("difficulty", target.actor.combat.defence.total, "Target Defence")

            
            this.tooltips.start(this)
            if (this.options.multi)
            {
              this.fields.difficulty += (this.options.multi - 1) * 2;
            }
            this.tooltips.finish(this, `Multi-Attack (${this.options.multi} Targets)`)


            this.tooltips.start(this)
            if (target.actor.system.combat.size == "large")
            {
                this.fields.pool += 1;
            }
            else if (target.actor.system.combat.size == "huge")
            {
                this.fields.pool += 2;
            }
            else if (target.actor.system.combat.size == "gargantuan")
            {
                this.fields.pool += 3;
            }
            this.tooltips.finish(this, "Target Size") 
        }
    }
  }

  computeRange()
  {
    let range
    let weapon = this.weapon;
    if (this.fields.distance && weapon.isRanged) {

      if (this.fields.distance <= weapon.range.short) 
      {
        range = "short"
      }

      else if (this.fields.distance > weapon.range.short && this.fields.distance <= weapon.range.medium) 
      {
        range = "medium"
      }

      else if (this.fields.distance > weapon.range.medium && this.fields.distance <= weapon.range.long) 
      {
        range = "long"
      }

      else 
      {
        range = ""
        if (this.fields.distance) {
          ui.notifications.warn(game.i18n.localize("DIALOG.OUT_OF_RANGE"))
        }
      }
    }

    if (range)
    {
      this.fields.range = range;
    }
  }

  _defaultFields() 
  {
      return mergeObject({
          distance : null,
          range : null,
          aim : false,
      }, super._defaultFields());
  }
}
