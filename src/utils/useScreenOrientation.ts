// 判断横屏竖屏
import { ref, onMounted, onUnmounted } from 'vue'

type Orientation = 'portrait' | 'landscape'

export function useScreenOrientation() {
  const orientation = ref<Orientation>(
    window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
  )

  const updateOrientation = () => {
    orientation.value = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
  }

  onMounted(() => {
    window.addEventListener('resize', updateOrientation)
    if (window.screen.orientation) {
      window.screen.orientation.addEventListener('change', updateOrientation)
    }
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateOrientation)
    if (window.screen.orientation) {
      window.screen.orientation.removeEventListener('change', updateOrientation)
    }
  })

  return { orientation }
}