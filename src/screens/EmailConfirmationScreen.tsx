import React from 'react';
import { View, Text, TouchableOpacity } from "react-native"
import { styles } from "./EmailConfirmationScreen.styles";
import { Mail } from "lucide-react-native"
import { useTranslation } from 'react-i18next';
import { Colors as BrandColors } from '../constants/Colors';

export const EmailConfirmationScreen = ({ navigation, route }: { navigation: any; route: any }) => {
  const { t } = useTranslation();
  const { email } = route.params

  const goToLogin = () => {
    navigation.navigate("Login")
  }
  let e = "sss";
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Mail color={BrandColors.primary} size={60} strokeWidth={1.5} />
        </View>
        <Text style={styles.title}>{t('email_confirmation.title')}</Text>
        <View style={styles.divider} />
        <Text style={styles.infoText}>{t('email_confirmation.info')}</Text>
        <View style={styles.emailBadge}>
          <Text style={styles.emailText}>{email}</Text>
        </View>
        <Text style={styles.instructionText}>
          {t('email_confirmation.instruction')}
        </Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={goToLogin}>
        <Text style={styles.buttonText}>{t('email_confirmation.go_to_login')}</Text>
      </TouchableOpacity>
    </View>
  )
}


