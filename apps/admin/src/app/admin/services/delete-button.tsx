'use client'

import { deleteService } from '@/lib/actions/services'
import { DeleteButton as DeleteButtonShared } from '@/components/admin/DeleteButton'

interface Props {
  id: string
}

export function DeleteButton({ id }: Props) {
  return (
    <DeleteButtonShared
      onDelete={deleteService.bind(null, id)}
      confirmMessage="Видалити послугу? Це видалить також переклади."
    />
  )
}
