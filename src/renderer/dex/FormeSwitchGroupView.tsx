import type { Form, Species } from '@shared/types/pokemon'
import type { FormeSwitchGroup } from '@shared/types/forme-switch-groups'
import { SpriteThumbnail } from './SpriteThumbnail'
import { formDisplayName, speciesDisplayName } from './formNames'

interface FormeSwitchGroupViewProps {
  group: FormeSwitchGroup
  species: Species
  forms: Form[]
  currentFormName: string
  onSelectForm: (formName: string) => void
}

const BUBBLE_SIZE = 84

/**
 * Leg 8 of the Species detail popup + evolution family tree milestone: a species' alternate,
 * non-evolutionary formes side by side (Deoxys's Attack/Defense/Speed, Kyurem's Black/White
 * fusions, etc. — see forme-switch-groups-data.ts's doc comment for the full catalogue and
 * why none of this is an evolution). Unlike EvolutionTree, every member here shares one
 * speciesId and there's no parent/child direction between them — the whole group is a flat
 * row of equally-ranked bubbles, not a chain.
 */
export function FormeSwitchGroupView({
  group,
  species,
  forms,
  currentFormName,
  onSelectForm
}: FormeSwitchGroupViewProps): JSX.Element {
  return (
    <div className="forme-switch-group">
      <p className="forme-switch-group-tag">Not an evolution — alternate forme</p>
      <div className="forme-switch-group-members">
        {group.formNames.map((formName) => {
          const form = forms.find((f) => f.speciesId === group.speciesId && f.formName === formName)
          const displayName = form ? formDisplayName(speciesDisplayName(species.name), form) : speciesDisplayName(species.name)
          const isCurrent = formName === currentFormName

          return (
            <div className="forme-switch-group-member" key={formName}>
              {form ? (
                <SpriteThumbnail
                  pokeapiId={form.pokeapiId}
                  spriteFormSuffix={form.spriteFormSuffix}
                  female={false}
                  displayName={displayName}
                  size={BUBBLE_SIZE}
                  className={
                    isCurrent
                      ? 'forme-switch-group-sprite forme-switch-group-sprite-current'
                      : 'forme-switch-group-sprite'
                  }
                  ariaLabel={isCurrent ? `${displayName} (currently shown)` : `Show ${displayName}`}
                  onClick={() => onSelectForm(formName)}
                />
              ) : (
                // Defensive only — build-forme-switch-groups.ts validates every formName
                // against forms.json before this data is committed.
                <span className="forme-switch-group-sprite-missing" style={{ width: BUBBLE_SIZE, height: BUBBLE_SIZE }}>
                  ?
                </span>
              )}
              <span className="forme-switch-group-member-name">{displayName}</span>
            </div>
          )
        })}
      </div>
      <p className="forme-switch-group-method">{group.method}</p>
      {!group.reversible && <p className="forme-switch-group-note">One-directional — cannot be switched back.</p>}
      {group.note && <p className="forme-switch-group-note">{group.note}</p>}
    </div>
  )
}
