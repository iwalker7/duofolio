import React, { useState } from "react";
import { Text, TouchableOpacity, Dimensions, View } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import OptionsModal from "./OptionsModal";
import showToast from "./Toast";
import { contrastColor } from "../constants";
import Icon from "./Icon";
import RNFS from "react-native-fs";

const ScreenWidth = Dimensions.get("window").width;

function BookItem(props) {
  const [isModalVisible, setModalVisible] = useState(false);

  async function onPress() {
    const decryptName =
      props.url.split(".")[0] + "_dec." + props.url.split(".")[1];
    const encryptName =
      props.url.split(".")[0] + "_inc." + props.url.split(".")[1];

    let { isConnected, isInternetReachable } = await NetInfo.fetch();
    if (isConnected && isInternetReachable) {
      if (props.isEncrypted) {
        props.navigation.navigate(`${props.type || "epub"}-reader`, {
          title: props.title,
          url: encryptName,
          isEncrypted: props.isEncrypted,
          index: props.index,
        });
      } else {
        RNFS.stat(decryptName)
          .then(() => {
            props.navigation.navigate(`${props.type || "epub"}-reader`, {
              title: props.title,
              url: decryptName,
              isEncrypted: props.isEncrypted,
              index: props.index,
            });
          })
          .catch((e) => {
            console.log(e.message);
            props.navigation.navigate(`${props.type || "epub"}-reader`, {
              title: props.title,
              url: props.url,
              isEncrypted: props.isEncrypted,
              index: props.index,
            });
          });
      }
    } else showToast("No internet connection");
  }

  return (
    <TouchableOpacity
      activeOpacity={0.4}
      style={styles.wrapper}
      onPress={onPress}
      onLongPress={() => setModalVisible(true)}
      key={props.index}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View>
          <Text style={styles.title} numberOfLines={1}>
            {props.title}
          </Text>
          <Text style={styles.author} numberOfLines={1}>
            {props.author || (props.type || "EPUB").toUpperCase() + " Document"}
          </Text>
        </View>
        {props.isEncrypted ? (
          <Icon {...icons.lock} style={styles.icon} />
        ) : (
          <Icon {...icons.unlock} style={styles.icon} />
        )}
      </View>
      <OptionsModal
        isVisible={isModalVisible}
        onPressCancel={() => setModalVisible(false)}
        url={props.url}
        index={props.index}
      />
    </TouchableOpacity>
  );
}

export default BookItem;

const styles = {
  wrapper: {
    height: 65,
    width: ScreenWidth,
    paddingLeft: 15,
    paddingRight: 15,
  },
  title: {
    fontSize: 15,
    fontFamily: "PlayfairDisplay-Bold",
    marginBottom: 3,
    color: contrastColor,
  },
  author: {
    fontSize: 14,
    color: "rgba(0, 0, 0, 0.8)",
  },
};

const icons = {
  share: {
    name: "share-2",
    type: "feather",
    size: 20,
  },
  remove: {
    name: "trash-2",
    type: "feather",
    size: 20,
  },
  lock: {
    name: "lock",
    type: "feather",
    size: 20,
  },
  unlock: {
    name: "unlock",
    type: "feather",
    size: 20,
  },
};
