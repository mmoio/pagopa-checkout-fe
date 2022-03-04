import { Box, CircularProgress } from "@mui/material";
import React from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { CancelPayment } from "../components/modals/CancelPayment";
import PageContainer from "../components/PageContent/PageContainer";
import { PaymentEmailForm } from "../features/payment/components/PaymentEmailForm/PaymentEmailForm";
import { PaymentEmailFormFields } from "../features/payment/models/paymentModel";
import { setCheckData as setData } from "../redux/slices/checkData";
import {
  getCheckData,
  getEmailInfo,
  getPaymentId,
  setCheckData,
  setEmailInfo,
} from "../utils/api/apiService";
import { cancelPayment, getPaymentCheckData } from "../utils/api/helper";
import { onBrowserUnload } from "../utils/eventListeners";

export default function PaymentEmailPage() {
  const navigate = useNavigate();
  const emailInfo = getEmailInfo();
  const currentPath = location.pathname.split("/")[1];

  const paymentId = getPaymentId();
  const checkData = getCheckData();
  const dispatch = useDispatch();
  const [cancelModalOpen, setCancelModalOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const onBrowserBackEvent = (e: any) => {
    e.preventDefault();
    setCancelModalOpen(true);
  };

  const onCancelResponse = () => {
    setLoading(false);
    navigate(`/${currentPath}/cancelled`);
  };

  const onError = () => {
    setLoading(false);
  };

  const onCancelPaymentSubmit = () => {
    setCancelModalOpen(false);
    setLoading(true);
    void cancelPayment(onError, onCancelResponse);
  };

  const onSubmit = React.useCallback((emailInfo: PaymentEmailFormFields) => {
    setEmailInfo(emailInfo);
    navigate(`/${currentPath}/paymentchoice`);
  }, []);

  const onCancel = () => setCancelModalOpen(false);

  React.useEffect(() => {
    if (!checkData.idPayment) {
      setLoading(true);
      void getPaymentCheckData({
        idPayment: paymentId.paymentId,
        onError: () => setLoading(false), // handle error on response,
        onResponse: (r) => {
          setCheckData(r);
          dispatch(setData(r));
          setLoading(false);
        },
        onNavigate: () => navigate(`/${currentPath}/ko`),
      });
    }
    window.addEventListener("beforeunload", onBrowserUnload);
    window.history.pushState(null, "", window.location.pathname);
    window.addEventListener("popstate", onBrowserBackEvent);
    return () => window.removeEventListener("popstate", onBrowserBackEvent);
  }, [checkData.idPayment]);

  return loading ? (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      my={10}
    >
      <CircularProgress />
    </Box>
  ) : (
    <PageContainer
      title="paymentEmailPage.title"
      description="paymentEmailPage.description"
    >
      <Box sx={{ mt: 6 }}>
        <PaymentEmailForm
          onCancel={() => setCancelModalOpen(true)}
          onSubmit={onSubmit}
          defaultValues={emailInfo}
        />
      </Box>
      <CancelPayment
        open={cancelModalOpen}
        onCancel={onCancel}
        onSubmit={onCancelPaymentSubmit}
      />
    </PageContainer>
  );
}