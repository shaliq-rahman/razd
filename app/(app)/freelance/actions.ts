'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'
import { freelanceProjectSchema, freelancePaymentSchema } from '@/lib/schemas'

export type ActionState = { error?: string; ok?: boolean }

function revalidateMoney() {
  revalidatePath('/')
  revalidatePath('/accounts')
  revalidatePath('/transactions')
  revalidatePath('/stats')
  revalidatePath('/recurring')
  revalidatePath('/freelance')
}

function projectFields(formData: FormData) {
  return {
    title: formData.get('title'),
    client_name: formData.get('client_name'),
    quoted_amount: formData.get('quoted_amount'),
    start_date: formData.get('start_date'),
    end_date: formData.get('end_date'),
    description: formData.get('description'),
    status: formData.get('status'),
  }
}

export async function createProject(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = freelanceProjectSchema.safeParse(projectFields(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Your session expired. Please sign in again.' }

  const { error } = await supabase
    .from('freelance_projects')
    .insert({ ...parsed.data, user_id: user.id })
  if (error) return { error: 'Could not save the project. Please try again.' }

  revalidateMoney()
  return { ok: true }
}

export async function updateProject(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = String(formData.get('id') ?? '')
  if (!id) return { error: 'Missing project.' }

  const parsed = freelanceProjectSchema.safeParse(projectFields(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createServerSupabase()
  const { error } = await supabase.from('freelance_projects').update(parsed.data).eq('id', id)
  if (error) return { error: 'Could not update the project. Please try again.' }

  revalidateMoney()
  return { ok: true }
}

export async function deleteProject(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = String(formData.get('id') ?? '')
  if (!id) return { error: 'Missing project.' }

  const supabase = await createServerSupabase()
  // Payments cascade with the project, but the income transactions they
  // created stay put — the money already moved into the account.
  const { error } = await supabase.from('freelance_projects').delete().eq('id', id)
  if (error) return { error: 'Could not delete the project. Please try again.' }

  revalidateMoney()
  return { ok: true }
}

export async function addPayment(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = freelancePaymentSchema.safeParse({
    project_id: formData.get('project_id'),
    account_id: formData.get('account_id'),
    amount: formData.get('amount'),
    occurred_at: formData.get('occurred_at'),
    note: formData.get('note'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Your session expired. Please sign in again.' }

  const [{ data: project }, { data: account }, { data: category }] = await Promise.all([
    supabase
      .from('freelance_projects')
      .select('id, title')
      .eq('id', parsed.data.project_id)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('accounts')
      .select('id')
      .eq('id', parsed.data.account_id)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('categories')
      .select('id')
      .eq('user_id', user.id)
      .eq('kind', 'income')
      .eq('name', 'Freelance')
      .maybeSingle(),
  ])
  if (!project) return { error: 'Project not found. Please refresh and try again.' }
  if (!account) return { error: 'Choose a valid account.' }

  const { data: transaction, error: transactionError } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      account_id: parsed.data.account_id,
      category_id: category?.id ?? null,
      amount: parsed.data.amount,
      kind: 'income',
      note: parsed.data.note || `Freelance: ${project.title}`,
      occurred_at: parsed.data.occurred_at,
    })
    .select('id')
    .single()
  if (transactionError || !transaction) {
    return { error: 'Could not record the payment. Please try again.' }
  }

  const { error: paymentError } = await supabase.from('freelance_payments').insert({
    user_id: user.id,
    project_id: parsed.data.project_id,
    account_id: parsed.data.account_id,
    transaction_id: transaction.id,
    amount: parsed.data.amount,
    occurred_at: parsed.data.occurred_at,
    note: parsed.data.note || null,
  })
  if (paymentError) {
    await supabase.from('transactions').delete().eq('id', transaction.id)
    return { error: 'Could not record the payment. Please try again.' }
  }

  revalidateMoney()
  return { ok: true }
}

export async function updatePayment(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = String(formData.get('id') ?? '')
  if (!id) return { error: 'Missing payment.' }

  const parsed = freelancePaymentSchema.safeParse({
    project_id: formData.get('project_id'),
    account_id: formData.get('account_id'),
    amount: formData.get('amount'),
    occurred_at: formData.get('occurred_at'),
    note: formData.get('note'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Your session expired. Please sign in again.' }

  const [{ data: existing }, { data: account }] = await Promise.all([
    supabase
      .from('freelance_payments')
      .select('id, transaction_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('accounts')
      .select('id')
      .eq('id', parsed.data.account_id)
      .eq('user_id', user.id)
      .maybeSingle(),
  ])
  if (!existing) return { error: 'Payment not found. Please refresh and try again.' }
  if (!account) return { error: 'Choose a valid account.' }

  if (existing.transaction_id) {
    const { error: transactionError } = await supabase
      .from('transactions')
      .update({
        account_id: parsed.data.account_id,
        amount: parsed.data.amount,
        occurred_at: parsed.data.occurred_at,
        note: parsed.data.note || null,
      })
      .eq('id', existing.transaction_id)
      .eq('user_id', user.id)
    if (transactionError) return { error: 'Could not update the payment. Please try again.' }
  }

  const { error } = await supabase
    .from('freelance_payments')
    .update({
      account_id: parsed.data.account_id,
      amount: parsed.data.amount,
      occurred_at: parsed.data.occurred_at,
      note: parsed.data.note || null,
    })
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) return { error: 'Could not update the payment. Please try again.' }

  revalidateMoney()
  return { ok: true }
}

export async function deletePayment(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = String(formData.get('id') ?? '')
  if (!id) return { error: 'Missing payment.' }

  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Your session expired. Please sign in again.' }

  const { data: existing } = await supabase
    .from('freelance_payments')
    .select('id, transaction_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!existing) return { error: 'Payment not found. Please refresh and try again.' }

  const { error } = await supabase
    .from('freelance_payments')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) return { error: 'Could not delete the payment. Please try again.' }

  if (existing.transaction_id) {
    await supabase.from('transactions').delete().eq('id', existing.transaction_id).eq('user_id', user.id)
  }

  revalidateMoney()
  return { ok: true }
}
