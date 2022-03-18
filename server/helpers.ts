//HELPER FUNCTIONS

import { Schema, model, connect, Document } from 'mongoose'

export async function ConnectDb(): Promise<void> {
  try {
    await connect(
      'mongodb+srv://{db_info_here}/irchat?retryWrites=true&w=majority'
    )
  } catch (err) {
    console.log(err)
  }
}

export function CurrentDate(): string {
  var today = new Date()
  var currentDate =
    today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate()

  return currentDate
}
