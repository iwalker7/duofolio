import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  ProgressBarAndroid,
} from "react-native";
import Modal from "react-native-modal";
import Share from "react-native-share";
import { connect } from "react-redux";
import * as actions from "../actions";
import Icon from "./Icon";
import { elevatedBG } from "../constants";
import RNFS from "react-native-fs";
import forge from "node-forge";
import showToast from "./Toast";
import DeviceInfo from "react-native-device-info";

// const key = forge.random.getBytesSync(16);
const key = DeviceInfo.getUniqueId();
const iv = forge.random.getBytesSync(16);
const limit_big = 1024 * 512;

const { height, width } = Dimensions.get("window");

function OptionsModal(props) {
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [state, setState] = useState({
    progress_encrypt: 0,
    progress_decrypt: 0,
  });

  let fileUri = props.url;
  let cipher = forge.cipher.createCipher("AES-CBC", key);
  let decipher = forge.cipher.createDecipher("AES-CBC", key);
  const decryptName = fileUri.split(".")[0] + "_dec." + fileUri.split(".")[1];
  const encryptName = fileUri.split(".")[0] + "_inc." + fileUri.split(".")[1];

  function onShare() {
    props.onPressCancel();
    Share.open({
      url: `file://${props.url}`,
      type: "application/epub+zip",
      failOnCancel: false,
    });
  }

  function onRemove() {
    props.onPressCancel();
    props.removeBook(props.index);
  }

  function onEdit(isEncrypted) {
    showToast(isEncrypted ? "Book is encrypted" : "Book is decrypted");
    isEncrypted
      ? setState({ ...state, progress_encrypt: 0 })
      : setState({ ...state, progress_decrypt: 0 });
    props.editBook(fileUri, isEncrypted);
    setTimeout(() => {
      props.onPressCancel();
    }, 1000);
  }

  function encryption() {
    setLoading(true);
    cipher.start({ iv: iv });

    RNFS.stat(fileUri).then((res) => {
      console.log("fileSize : ", res.size);
      if (res.size > limit_big) {
        RNFS.writeFile(encryptName, "", "ascii")
          .then(() => {
            console.log("FILE READY IN APPEND");

            encryptBigFile(fileUri, 0, res.size, cipher, decipher);
          })
          .catch((err) => {
            setLoading(false);
            console.warn(err.message);
          });
      } else {
        RNFS.readFile(fileUri, "ascii").then((r1) => {
          console.log(r1.length);
          cipher.update(forge.util.createBuffer(r1));
          cipher.finish();
          RNFS.writeFile(encryptName, cipher.output.getBytes(), "ascii")
            .then((r2) => {
              console.log(r2);
              console.log("FILE ENCRYPTION IS OKAY");
              onEdit(true);
              setLoading(false);
            })
            .catch((e1) => {
              showToast("Cant write encrypted file");
              console.log("Cant write encrypted file");
              setLoading(false);
              console.warn(e1);
            });
        });
      }
    });
  }

  function onEncrypt() {
    RNFS.stat(encryptName)
      .then((res) => {
        if (res.size > 0) {
          showToast("Book is encrypted");
        } else {
          encryption();
        }
      })
      .catch((e) => {
        encryption();
        console.log(e.message);
      });
  }

  function encryptBigFile(fileUri, start, size, cipher) {
    RNFS.read(fileUri, limit_big, start, "ascii")
      .then((res1) => {
        cipher.update(forge.util.createBuffer(res1));
        RNFS.appendFile(encryptName, cipher.output.getBytes(), "ascii").then(
          () => {
            console.log("APPEND BYTES ENCRYPTED");
            if (start + limit_big <= size) {
              setState({ ...state, progress_encrypt: start / size });

              encryptBigFile(fileUri, start + limit_big, size, cipher);
            } else {
              cipher.finish();
              RNFS.appendFile(encryptName, cipher.output.getBytes(), "ascii")
                .then(() => {
                  console.log("APPENDFILE ENCRYPT");
                  setState({
                    ...state,
                    progress_encrypt: 1,
                  });

                  onEdit(true);
                  setLoading(false);
                })
                .catch((e) => {
                  setLoading(false);
                  console.warn(e);
                });
            }
          }
        );
      })
      .catch((e) => {
        console.warn(e);
      });
  }

  function decryption() {
    setLoading2(true);
    decipher.start({ iv: iv });
    RNFS.stat(fileUri)
      .then((res) => {
        console.log("fileSize : ", res.size);

        if (res.size > limit_big) {
          RNFS.writeFile(decryptName, "", "ascii")
            .then(() => {
              RNFS.stat(encryptName).then((r5) => {
                decryptBigFile(fileUri, 0, r5.size, decipher);
              });
            })
            .catch((e) => {
              setLoading2(false);
              console.warn(e);
            });
        } else {
          RNFS.readFile(encryptName, "ascii").then((r3) => {
            decipher.update(forge.util.createBuffer(r3));
            decipher.finish();
            RNFS.writeFile(decryptName, decipher.output.getBytes(), "ascii")
              .then((r4) => {
                setLoading2(false);
                onEdit(false);
                console.log("FILE DECRYPT IS OKEY");
              })
              .catch((e2) => {
                setLoading2(false);
                console.warn(e2);
              });
          });
        }
      })
      .catch((e) => {
        showToast("cant read file");
        console.log(e.message);
        setLoading2(false);
      });
  }

  function onDecrypt() {
    RNFS.stat(decryptName)
      .then((res) => {
        if (res.size > 0) {
          showToast("Book is decrypted");
        } else {
          decryption();
        }
      })
      .catch((e) => {
        decryption();
        console.log(e.message);
      });
  }

  function decryptBigFile(fileUri, start, size, decipher) {
    RNFS.read(encryptName, limit_big, start, "ascii")
      .then((r1) => {
        decipher.update(forge.util.createBuffer(r1));
        RNFS.appendFile(decryptName, decipher.output.getBytes(), "ascii").then(
          () => {
            console.log("APPEND BYTES DECRYPTED");
            if (start + limit_big <= size) {
              setState({ ...state, progress_decrypt: start / size });

              decryptBigFile(fileUri, start + limit_big, size, decipher);
            } else {
              decipher.finish();

              RNFS.appendFile(decryptName, decipher.output.getBytes(), "ascii")
                .then(() => {
                  console.log("APPENDFILE DECRYPT");
                  setState({
                    progress_decrypt: 1,
                  });
                  onEdit(false);
                  setLoading2(false);
                })
                .catch((e) => setLoading2(false));
            }
          }
        );
      })
      .catch((e) => setLoading2(false));
  }

  return (
    <Modal
      style={styles.modal}
      isVisible={props.isVisible}
      deviceHeight={height}
      onBackButtonPress={props.onPressCancel}
      onBackdropPress={props.onPressCancel}
      onSwipeComplete={props.onPressCancel}
      backdropColor="rgba(0, 0, 0, 0.5)"
      swipeDirection="down"
      animationOutTiming={100}
      animationInTiming={100}
      hideModalContentWhileAnimating
    >
      <View style={styles.wrapper}>
        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center" }}
          onPress={onEncrypt}
        >
          <View style={[styles.item, { width: "90%" }]}>
            <Icon {...icons.lock} style={styles.icon} />
            <Text style={styles.text}>Encrypt</Text>
          </View>
          {loading && <ActivityIndicator color={"black"} />}
        </TouchableOpacity>
        {loading && (
          <ProgressBarAndroid
            styleAttr="Horizontal"
            indeterminate={false}
            progress={state.progress_encrypt}
          />
        )}
        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center" }}
          onPress={onDecrypt}
        >
          <View style={[styles.item, { width: "90%" }]}>
            <Icon {...icons.unlock} style={styles.icon} />
            <Text style={styles.text}>Decrypt</Text>
          </View>
          {loading2 && <ActivityIndicator color={"black"} />}
        </TouchableOpacity>
        {loading2 && (
          <ProgressBarAndroid
            styleAttr="Horizontal"
            indeterminate={false}
            progress={state.progress_decrypt}
          />
        )}
        <TouchableOpacity style={styles.item} onPress={onShare}>
          <Icon {...icons.share} style={styles.icon} />
          <Text style={styles.text}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.item} onPress={onRemove}>
          <Icon {...icons.remove} style={styles.icon} />
          <Text style={styles.text}>Remove</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

export default connect(
  null,
  actions
)(OptionsModal);

const styles = {
  modal: {
    justifyContent: "flex-end",
    alignItems: "center",
  },
  wrapper: {
    // height: 140,
    width: width - 16,
    backgroundColor: elevatedBG,
    elevation: 5,
    justifyContent: "space-evenly",
    marginBottom: -20,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  item: {
    // height: 60,
    paddingVertical: 10,
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  icon: {
    paddingLeft: 20,
    paddingRight: 20,
  },
  text: {
    fontFamily: "Circular",
    fontSize: 15,
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
