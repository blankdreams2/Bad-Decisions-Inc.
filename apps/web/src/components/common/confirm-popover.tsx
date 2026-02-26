'use client'

import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/common/button'

interface ConfirmPopoverProps {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
  children: React.ReactNode
}

export function ConfirmPopover({
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  children,
}: ConfirmPopoverProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-64 border-white/10 bg-surface p-4" align="end">
        <p className="text-sm font-semibold text-white">{title}</p>
        {description && (
          <p className="mt-1 text-xs text-white/40">{description}</p>
        )}
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="flex-1"
            onClick={() => setOpen(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="flex-1"
            onClick={async () => {
              await onConfirm()
              setOpen(false)
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
