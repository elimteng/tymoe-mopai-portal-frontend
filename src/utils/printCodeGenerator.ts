import type { RecipeStep, StepType } from '@/services/recipe/types'

/**
 * 生成单个步骤的打印代码
 * @param step 步骤信息
 * @param stepType 步骤类型
 * @returns 生成的打印代码（如：mk200）
 */
export function generateStepPrintCode(step: RecipeStep, stepType: StepType): string {
  const code = stepType.code || ''
  const instruction = step.instruction || ''
  return `${code}${instruction}`
}

/**
 * 生成完整配方的打印代码
 * @param steps 所有步骤
 * @param stepTypes 步骤类型映射（stepTypeId -> StepType）
 * @returns 完整的打印代码
 * 
 * 示例：
 * - 200ml milk → mk200
 * - [mk200]2 → 搅拌机包含milk步骤，按2键
 */
export function generateRecipePrintCode(
  steps: RecipeStep[],
  stepTypes: Map<string, StepType>
): string {
  // 标记哪些步骤已被包含（不需要单独打印）
  const containedStepIds = new Set<string>()

  // 第一遍：收集所有被包含的步骤
  steps.forEach(step => {
    if (step.containedSteps && step.containedSteps.length > 0) {
      step.containedSteps.forEach(containedId => containedStepIds.add(containedId))
    }
  })

  // 第二遍：生成打印代码
  const printCodes: string[] = []

  steps.forEach(step => {
    const stepType = stepTypes.get(step.stepTypeId)
    if (!stepType) return

    // 如果这个步骤被其他步骤包含，跳过
    if (step.id && containedStepIds.has(step.id)) {
      return
    }

    // 任何步骤都可以包含其他步骤
    if (step.containedSteps && step.containedSteps.length > 0) {
      // 有包含的步骤：生成被包含步骤的代码，步骤之间用空格分隔
      const containedCodes = step.containedSteps
        .map(containedId => {
          const containedStep = steps.find(s => s.id === containedId)
          if (!containedStep) return ''

          const containedStepType = stepTypes.get(containedStep.stepTypeId)
          if (!containedStepType) return ''

          return generateStepPrintCode(containedStep, containedStepType)
        })
        .filter(code => code)
        .join(' ')

      const instruction = step.instruction || ''
      const code = stepType.code || ''

      // 新规则：统一用括号包含被包含的步骤，instruction直接跟在括号后面
      // 示例：mk(sg) 或 blender(mk sg)2
      const containerCode = `${code}(${containedCodes})${instruction}`
      printCodes.push(containerCode)
    } else {
      // 没有包含的步骤：只显示该步骤的代码
      const code = stepType.code || ''
      const instruction = step.instruction || ''
      if (code || instruction) {
        printCodes.push(`${code}${instruction}`)
      }
    }
  })

  return printCodes.join(' ')
}

/**
 * 验证打印代码格式
 * @param code 打印代码
 * @returns 是否有效
 */
export function validatePrintCode(code: string): boolean {
  if (!code || code.trim().length === 0) return false
  // 可以添加更多验证规则
  return true
}

/**
 * 根据步骤生成实时预览的打印代码
 * 用于UI实时显示
 */
export interface StepPreview {
  stepType: StepType
  instruction: string
  containedSteps?: StepPreview[]
  generatedCode: string
  isContained: boolean  // 是否被其他步骤包含
}

export function generateStepPreviews(
  steps: Array<{ stepTypeId: string; instruction?: string; containedSteps?: number[] }>,
  stepTypes: Map<string, StepType>
): StepPreview[] {
  // 标记哪些步骤被包含
  const containedIndices = new Set<number>()
  steps.forEach(step => {
    step.containedSteps?.forEach(index => containedIndices.add(index))
  })

  return steps.map((step, index) => {
    const stepType = stepTypes.get(step.stepTypeId)
    if (!stepType) {
      return {
        stepType: { id: '', code: '?', name: 'Unknown', category: 'action' } as StepType,
        instruction: step.instruction || '',
        generatedCode: '?',
        isContained: containedIndices.has(index)
      }
    }

    const instruction = step.instruction || ''
    let generatedCode = ''

    // 任何步骤都可以包含其他步骤
    if (step.containedSteps && step.containedSteps.length > 0) {
      // 生成被包含步骤的代码，步骤之间用空格分隔
      const containedCodes = step.containedSteps
        .map(containedIndex => {
          const containedStep = steps[containedIndex]
          if (!containedStep) return ''
          const containedType = stepTypes.get(containedStep.stepTypeId)
          if (!containedType) return ''
          return `${containedType.code}${containedStep.instruction || ''}`
        })
        .filter(code => code)
        .join(' ')

      const code = stepType.code || ''

      // 新规则：统一用括号包含被包含的步骤，instruction直接跟在括号后面
      // 示例：mk(sg) 或 blender(mk sg)2
      generatedCode = `${code}(${containedCodes})${instruction}`
    } else {
      // 没有包含的步骤：只显示该步骤的代码
      generatedCode = `${stepType.code}${instruction}`
    }

    return {
      stepType,
      instruction,
      generatedCode,
      isContained: containedIndices.has(index)
    }
  })
}

