import { useRouter } from 'expo-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { View, StyleSheet, ScrollView } from 'react-native'
import { Text } from 'react-native-paper'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { updateCustomerProfile } from '../../src/api/customer'
import { Card } from '../../src/components/ui/Card'
import { Button } from '../../src/components/ui/Button'
import { Input } from '../../src/components/ui/Input'
import { Tokens } from '../../src/theme'

const profileSchema = z.object({
  contactName: z.string().min(1, '请输入联系人'),
  contactPhone: z.string().min(1, '请输入手机号').regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
})

type ProfileForm = z.infer<typeof profileSchema>

export default function ProfileEditPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      contactName: '',
      contactPhone: '',
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: ProfileForm) => updateCustomerProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-profile'] })
      router.back()
    },
    onError: (err: any) => {
      alert(err.message || '更新失败')
    },
  })

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Card header="基本信息" padding="md">
          <Controller
            control={control}
            name="contactName"
            render={({ field: { onChange, value } }) => (
              <Input
                label="联系人姓名"
                icon="user"
                value={value}
                onChangeText={onChange}
                error={errors.contactName?.message}
                containerStyle={styles.input}
              />
            )}
          />

          <Controller
            control={control}
            name="contactPhone"
            render={({ field: { onChange, value } }) => (
              <Input
                label="联系电话"
                icon="phone"
                value={value}
                onChangeText={onChange}
                keyboardType="phone-pad"
                error={errors.contactPhone?.message}
                containerStyle={styles.input}
              />
            )}
          />
        </Card>

        <Text variant="bodySmall" style={styles.hint}>
          收货地址可在结算页面填写，这里仅修改联系方式
        </Text>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleSubmit(data => updateMutation.mutate(data))}
          loading={updateMutation.isPending}
          style={styles.submitBtn}
        >
          保存
        </Button>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Tokens.background },
  scrollView: { flex: 1 },
  input: {
    marginBottom: 12,
  },
  hint: { color: Tokens.muted, marginHorizontal: 12, marginVertical: 8, fontSize: 12 },
  submitBtn: { margin: 12 },
})
