export type NotificationData = {
    id: number
    type: AlertType
    message: string
    active: boolean
    priority: number
}
export type AlertType = "info" | "success" | "warning" | "error"
