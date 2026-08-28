'use client'

import { deleteFaqItem } from '@/lib/actions/faq'
import { DeleteButton as DeleteButtonShared } from '@/components/admin/DeleteButton'

interface Props {
  id: string
}

export function DeleteButton({ id }: Props) {
  return (
    <DeleteButtonShared
      onDelete={deleteFaqItem.bind(null, id)}
      confirmMessage="Видалити питання FAQ? Це видалить також переклади."
    />
  )
}
