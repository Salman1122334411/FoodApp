import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { Mail } from "lucide-react-native"

export const EmailConfirmationScreen = ({ navigation, route }: { navigation: any; route: any }) => {
 // const { email } = route.params

  const goToLogin = () => {
    navigation.navigate("Login")
  }
let e="sss";
  return (
    <View style={styles.container}>
      <View style={styles.messageContainer}>
        <Mail color="#0066cc" size={48} style={styles.icon} />
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.infoText}>We've sent a confirmation email to:</Text>
        <Text style={styles.emailText}>{e}</Text>
        <Text style={styles.instructionText}>
          Click the link in the email to confirm your account. If you don't see it, check your spam folder.
        </Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={goToLogin}>
        <Text style={styles.buttonText}>Take me to login</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  messageContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 24,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  infoText: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: "center",
    color: "#555",
  },
  emailText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#0066cc",
  },
  instructionText: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
    lineHeight: 20,
  },
  button: {
    backgroundColor: "#0066cc",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
})

