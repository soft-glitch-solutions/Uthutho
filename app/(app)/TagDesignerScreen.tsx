import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Text,
  Alert,
} from "react-native";
import Svg, { Text as SvgText, Defs, LinearGradient, Stop } from "react-native-svg";
import { useFonts, Urbanist_700Bold, Urbanist_400Regular } from "@expo-google-fonts/urbanist";
import { MaterialIcons } from "@expo/vector-icons";
import { ColorPicker } from "react-native-color-picker";

interface Tag {
  tagText: string;
  color1: string;
  color2: string;
  useGradient: boolean;
  fontSize: number;
  fontWeight: "normal" | "bold";
}

export default function TagDesignerScreen() {
  const [tag, setTag] = useState<Tag>({
    tagText: "@MyTag",
    color1: "#FF6600",
    color2: "#FFD500",
    useGradient: true,
    fontSize: 48,
    fontWeight: "bold",
  });

  const [showPicker, setShowPicker] = useState<"color1" | "color2" | false>(false);

  const [fontsLoaded] = useFonts({
    Urbanist_700Bold,
    Urbanist_400Regular,
  });

  if (!fontsLoaded) return null;

  const handleSave = async () => {
    // 🔥 Connect this to Firebase or Supabase later
    console.log("Tag saved:", tag);
    Alert.alert("✅ Tag Saved", "Your tag design has been saved!");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>🎨 Uthutho Tag Designer</Text>

      {/* Preview */}
      <View style={styles.previewContainer}>
        <Svg height="150" width="100%">
          <Defs>
            <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={tag.color1} stopOpacity="1" />
              <Stop offset="1" stopColor={tag.color2} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <SvgText
            fill={tag.useGradient ? "url(#grad)" : tag.color1}
            stroke="#000"
            strokeWidth={1}
            fontSize={tag.fontSize}
            fontWeight={tag.fontWeight}
            x="50%"
            y="50%"
            textAnchor="middle"
            fontFamily="Urbanist_700Bold"
          >
            {tag.tagText}
          </SvgText>
        </Svg>
      </View>

      {/* Tag Input */}
      <TextInput
        value={tag.tagText}
        onChangeText={(text) => setTag({ ...tag, tagText: text })}
        style={styles.input}
        placeholder="Enter your tag..."
        maxLength={20}
      />

      {/* Color Selectors */}
      <View style={styles.colorRow}>
        <TouchableOpacity
          style={[styles.colorBox, { backgroundColor: tag.color1 }]}
          onPress={() => setShowPicker("color1")}
        />
        {tag.useGradient && (
          <TouchableOpacity
            style={[styles.colorBox, { backgroundColor: tag.color2 }]}
            onPress={() => setShowPicker("color2")}
          />
        )}
      </View>

      {/* Color Picker */}
      {showPicker && (
        <View style={styles.pickerContainer}>
          <ColorPicker
            onColorSelected={(color) => {
              if (showPicker === "color1") setTag({ ...tag, color1: color });
              if (showPicker === "color2") setTag({ ...tag, color2: color });
              setShowPicker(false);
            }}
            style={{ height: 200 }}
          />
          <TouchableOpacity
            style={styles.closePickerBtn}
            onPress={() => setShowPicker(false)}
          >
            <Text style={styles.closePickerText}>Close</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Gradient Toggle */}
      <View style={styles.controlRow}>
        <TouchableOpacity
          style={styles.toggle}
          onPress={() => setTag({ ...tag, useGradient: !tag.useGradient })}
        >
          <MaterialIcons
            name={tag.useGradient ? "gradient" : "format-color-fill"}
            size={24}
            color="#333"
          />
          <Text style={styles.toggleText}>
            {tag.useGradient ? "Gradient On" : "Gradient Off"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Font Size Control */}
      <View style={styles.sliderContainer}>
        <Text style={{ fontSize: 16 }}>Font Size: {tag.fontSize}</Text>
        <View style={styles.sliderButtons}>
          <TouchableOpacity
            style={styles.sliderButton}
            onPress={() =>
              setTag({ ...tag, fontSize: Math.max(24, tag.fontSize - 4) })
            }
          >
            <Text style={styles.sliderText}>–</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sliderButton}
            onPress={() =>
              setTag({ ...tag, fontSize: Math.min(80, tag.fontSize + 4) })
            }
          >
            <Text style={styles.sliderText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveText}>💾 Save My Tag</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f4f4f4",
    flexGrow: 1,
  },
  header: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },
  previewContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    textAlign: "center",
    fontSize: 18,
    marginBottom: 20,
  },
  colorRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 15,
    marginBottom: 20,
  },
  colorBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#999",
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
  },
  closePickerBtn: {
    backgroundColor: "#eee",
    marginTop: 10,
    padding: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  closePickerText: {
    color: "#333",
    fontWeight: "bold",
  },
  controlRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  toggleText: {
    fontSize: 16,
  },
  sliderContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  sliderButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  sliderButton: {
    backgroundColor: "#ddd",
    borderRadius: 50,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  sliderText: {
    fontSize: 24,
  },
  saveBtn: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
  },
  saveText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
});
