import SelectField from "material-ui/SelectField";
import MenuItem from "material-ui/MenuItem";
import { httpRequest } from "egov-ui-kit/utils/api";
import { createReceiptDetails } from "../../../PaymentStatus/Components/createReceipt";
import generateReceipt from "../../../PaymentStatus/Components/receiptsPDF";
import React, { Component } from "react";
import get from "lodash/get";
import Label from "egov-ui-kit/utils/translationNode";
import { getUserInfo } from "egov-ui-kit/utils/localStorageUtils";

const styles = {
  customWidth: {
    width: 120,
    backgroundColor: "#F0F0F0",
    height: "25px",
    paddingLeft: "10px",
  },
  iconStyle: { top: "-13px", fill: "#484848", width: "35px" },
  underlineStyle: { display: "none" },
  hintStyle: { color: "#484848", top: 0 },
};

class DropDown extends Component {
  state = {
    imageUrl: "",
  };

  componentDidMount = () => {
    const { item } = this.props;
    const tenantId = item && item.tenantId;
    tenantId &&
      this.convertImgToDataURLviaCanvas(
        this.createImageUrl(tenantId),
        function(data) {
          this.setState({ imageUrl: data });
        }.bind(this)
      );
  };

  convertImgToDataURLviaCanvas = (url, callback, outputFormat) => {
    var img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = function() {
      var canvas = document.createElement("CANVAS");
      var ctx = canvas.getContext("2d");
      var dataURL;
      canvas.height = this.height;
      canvas.width = this.width;
      ctx.drawImage(this, 0, 0);
      dataURL = canvas.toDataURL(outputFormat);
      callback(dataURL);
      canvas = null;
    };
    img.src = url;
  };

  createImageUrl = (tenantId) => {
    return `https://s3.ap-south-1.amazonaws.com/pb-egov-assets/${tenantId}/logo.png`;
  };

  onSelectFieldChange = (event, key, payload, imageUrl) => {
    const { generalMDMSDataById, history, item } = this.props;
    const { downloadReceipt } = this;
    switch (payload) {
      case "Re-Assess":
        history &&
          history.push(
            `/property-tax/assessment-form?FY=${item.financialYear}&assessmentId=${item.latestAssessmentNumber}&isReassesment=true&propertyId=${
              item.propertyId
            }&tenantId=${item.tenantId}`
          );

        break;
      case "Download Receipt":
        //Need 1. Property, 2. Property Details, 3. receiptdetails
        // call receiptcreate func
        downloadReceipt(item, generalMDMSDataById, false, imageUrl);
        break;
      case "Download Citizen Receipt":
        downloadReceipt(item, generalMDMSDataById, false, imageUrl);
        break;
      case "Download Employee Receipt":
        downloadReceipt(item, generalMDMSDataById, true, imageUrl);
        break;
      case "Complete Payment":
        history &&
          history.push(
            `/property-tax/assessment-form?FY=${item.financialYear}&assessmentId=${
              item.assessmentNo
            }&isReassesment=true&isCompletePayment=true&propertyId=${item.propertyId}&tenantId=${item.tenantId}`
          );

        break;
    }
  };

  downloadReceipt = async (item, generalMDMSDataById, isEmployeeReceipt, imageUrl) => {
    const queryObj = [{ key: "tenantId", value: item.tenantId }, { key: "consumerCode", value: item.consumerCode }];

    try {
      const payload = await httpRequest("/collection-services/receipts/_search", "_search", queryObj, {}, [], { ts: 0 });
      const lastAmount = payload && payload.Receipt && get(payload.Receipt[0], "Bill[0].billDetails[0].totalAmount");
      const totalAmountBeforeLast =
        payload &&
        payload.Receipt &&
        payload.Receipt.reduce((acc, curr, index) => {
          if (index !== 0) {
            acc += get(curr, "Bill[0].billDetails[0].amountPaid");
          }
          return acc;
        }, 0);
      const totalAmountToPay = lastAmount + totalAmountBeforeLast;
      const totalAmountPaid =
        payload &&
        payload.Receipt &&
        payload.Receipt.reduce((acc, curr) => {
          acc += get(curr, "Bill[0].billDetails[0].amountPaid");
          return acc;
        }, 0);
      const receiptDetails =
        payload &&
        payload.Receipt &&
        createReceiptDetails(
          item.property,
          item.propertyDetails,
          payload.Receipt[0],
          item.localizationLabels,
          item.cities,
          totalAmountToPay,
          totalAmountPaid
        );
      receiptDetails && generateReceipt("pt-reciept-citizen", receiptDetails, generalMDMSDataById, imageUrl, isEmployeeReceipt, {itemData: item, property: item.property, receipt: payload.Receipt});
    } catch (e) {
      console.log(e);
    }
  };

  render() {
    const { item } = this.props;
    const { imageUrl } = this.state;
    const userType = getUserInfo() && JSON.parse(getUserInfo()).type;
    return (
      <div>
        <SelectField
          autoWidth={true}
          className="pt-action-dropDown"
          hintText={<Label label="PT_SELECT_ACTION" />}
          underlineStyle={styles.underlineStyle}
          iconStyle={styles.iconStyle}
          style={styles.customWidth}
          hintStyle={styles.hintStyle}
          onChange={(event, key, payload) => this.onSelectFieldChange(event, key, payload, imageUrl)}
        >
          {userType === "CITIZEN" && <MenuItem value="Download Receipt" primaryText={<Label label="PT_DOWNLOAD_RECEIPT" />} />}
          {userType === "EMPLOYEE" && <MenuItem value="Download Citizen Receipt" primaryText={<Label label="PT_DOWNLOAD_CITIZEN_RECEIPT" />} />}
          {userType === "EMPLOYEE" && <MenuItem value="Download Employee Receipt" primaryText={<Label label="PT_DOWNLOAD_EMPLOYEE_RECEIPT" />} />}
          {(item.status === "Paid" || item.status === "Partially Paid") && (
            <MenuItem value="Re-Assess" primaryText={<Label label="PT_RE_ASSESS" />} />
          )}
          {item.status === "Partially Paid" && <MenuItem value="Complete Payment" primaryText={<Label label="PT_COMPLETE_PAYMENT" />} />}
        </SelectField>
      </div>
    );
  }
}

export default DropDown;
