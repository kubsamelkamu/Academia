import type { ChatMessage } from "@/types/messages"

export function readByLabel(readers: string[] | undefined): string {
  if (!readers || readers.length === 0) {
    return "Read"
  }

  if (readers.length === 1) {
    return `Read by ${readers[0]}`
  }

  if (readers.length === 2) {
    return `Read by ${readers[0]}, ${readers[1]}`
  }

  return `Read by ${readers[0]}, ${readers[1]} +${readers.length - 2}`
}

export function getOutgoingReceiptLabel(message: ChatMessage): string | null {
  if (message.direction !== "outgoing") {
    return null
  }

  if (message.receiptStatus === "read") {
    return readByLabel(message.readBy)
  }

  if (message.receiptStatus === "delivered") {
    return "Delivered"
  }

  return "Sent"
}
