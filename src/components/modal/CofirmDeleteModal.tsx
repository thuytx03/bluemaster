import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ConfirmDeleteModalProps {
    title?: string
    description?: string
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
}
const ConfirmDeleteModal = ({ isOpen, title, description, onClose, onConfirm }: ConfirmDeleteModalProps) => {
    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title || 'Xác nhận xoá'}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description || 'Bạn có chắc chắn muốn xoá không?'}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex items-center justify-center space-x-2">
                    <AlertDialogCancel className="cursor-pointer mt-0">Huỷ</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm} className="bg-sky-600 hover:bg-sky-700 cursor-pointer">Xác nhận</AlertDialogAction>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export default ConfirmDeleteModal
