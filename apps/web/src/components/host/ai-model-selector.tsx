'use client'

import { useState } from 'react'
import { AI_MODELS, AI_MODEL_GROUPS, getModelLabel } from '@/data/ai-models'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ChevronDownIcon, CheckIcon } from 'lucide-react'

interface AiModelSelectorProps {
  value: string
  onChange: (value: string) => void
}

export function AiModelSelector({ value, onChange }: AiModelSelectorProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-9 w-full items-center justify-between rounded-lg border border-white/15 bg-white/5 px-3 text-xs text-white transition-colors hover:bg-white/8"
        >
          <span className="truncate">{getModelLabel(value)}</span>
          <ChevronDownIcon className="ml-2 h-3.5 w-3.5 shrink-0 text-white/30" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="max-h-72 w-(--radix-popover-trigger-width) overflow-y-auto border-white/10 bg-surface p-1 backdrop-blur-xl"
        align="start"
      >
        {AI_MODEL_GROUPS.map((group) => (
          <div key={group}>
            <p className="px-2 py-1.5 text-[10px] font-medium text-white/25">{group}</p>
            {AI_MODELS.filter((m) => m.group === group).map((model) => {
              const selected = model.value === value
              return (
                <button
                  key={model.value}
                  type="button"
                  onClick={() => {
                    onChange(model.value)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors ${
                    selected ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span>{model.label}</span>
                  {selected && <CheckIcon className="h-3.5 w-3.5 text-white/50" />}
                </button>
              )
            })}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  )
}
