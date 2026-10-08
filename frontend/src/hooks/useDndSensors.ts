import {
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

// Shared sensor set for all sortable lists: small pointer constraint so taps
// still work, press-hold touch dragging, and full keyboard dragging support.
export function useDndSensors() {
    const pointer = useSensor(PointerSensor, { activationConstraint: { distance: 6 } });
    const touch = useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } });
    const keyboard = useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates });
    return useSensors(pointer, touch, keyboard);
}
