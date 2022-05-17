import { Box } from "@mui/material";
import React from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { useNavigate } from "react-router-dom";
import { RptId } from "../../generated/definitions/payment-activations-api/RptId";
import ErrorModal from "../components/modals/ErrorModal";
import PageContainer from "../components/PageContent/PageContainer";
import { InputCardForm } from "../features/payment/components/InputCardForm/InputCardForm";
import { InputCardFormFields } from "../features/payment/models/paymentModel";
import {
  getCheckData,
  getNoticeInfo,
  getPaymentId,
  getPaymentInfo,
  getReCaptchaKey,
  setPaymentId,
} from "../utils/api/apiService";
import {
  activePaymentWithPolling,
  getPaymentCheckData,
  getSessionWallet,
} from "../utils/api/helper";
import { getConfigOrThrow } from "../utils/config/config";
import { ErrorsType } from "../utils/errors/checkErrorsModel";
import { CheckoutRoutes } from "./models/routeModel";

export default function InputCardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [errorModalOpen, setErrorModalOpen] = React.useState(false);
  const [error, setError] = React.useState("");
  const [timeoutId, setTimeoutId] = React.useState<number>();
  const [wallet, setWallet] = React.useState<InputCardFormFields>();
  const ref = React.useRef<ReCAPTCHA>(null);
  const config = getConfigOrThrow();

  React.useEffect(() => {
    if (loading && !errorModalOpen) {
      const id = window.setTimeout(() => {
        setError(ErrorsType.POLLING_SLOW);
        setErrorModalOpen(true);
      }, config.CHECKOUT_API_TIMEOUT as number);
      setTimeoutId(id);
    } else if (timeoutId) {
      window.clearTimeout(timeoutId);
    }
  }, [loading, errorModalOpen]);

  const onError = (m: string) => {
    setLoading(false);
    setError(m);
    setErrorModalOpen(true);
    ref.current?.reset();
  };

  const onResponse = async (
    res: { idPagamento: string },
    wallet: InputCardFormFields
  ) => {
    setPaymentId(res);
    await getPaymentCheckData({
      idPayment: res.idPagamento,
      onError,
      onResponse: () => {
        void getSessionWallet(wallet as InputCardFormFields, onError, () => {
          setLoading(false);
          navigate(`/${CheckoutRoutes.RIEPILOGO_PAGAMENTO}`);
        });
      },
      onNavigate: () => navigate(`/${CheckoutRoutes.ERRORE}`),
    });
  };

  const onSubmit = React.useCallback(
    async (wallet: InputCardFormFields) => {
      const noticeInfo = getNoticeInfo();
      const paymentInfo = getPaymentInfo();
      const paymentId = getPaymentId().paymentId;
      const checkDataId = getCheckData().id;
      const rptId: RptId = `${noticeInfo.cf}${noticeInfo.billCode}`;
      const token = await ref.current?.executeAsync();
      setLoading(true);
      setWallet(wallet);

      if (paymentId && checkDataId) {
        void getSessionWallet(wallet as InputCardFormFields, onError, () => {
          setLoading(false);
          navigate(`/${CheckoutRoutes.RIEPILOGO_PAGAMENTO}`);
        });
      } else {
        void activePaymentWithPolling({
          paymentInfo,
          rptId,
          token: token || "",
          pollingActivationAttempts:
            config.CHECKOUT_POLLING_ACTIVATION_ATTEMPTS as number,
          onResponse: (res: { idPagamento: string }) => onResponse(res, wallet),
          onError,
        });
      }
    },
    [ref]
  );

  const onRetry = React.useCallback(() => {
    setErrorModalOpen(false);
    void onSubmit(wallet as InputCardFormFields);
  }, []);

  const onCancel = () => navigate(-1);
  return (
    <PageContainer title="inputCardPage.title">
      <Box sx={{ mt: 6 }}>
        <InputCardForm
          onCancel={onCancel}
          onSubmit={onSubmit}
          loading={loading}
        />
      </Box>
      {!!error && (
        <ErrorModal
          error={error}
          open={errorModalOpen}
          onClose={() => {
            setErrorModalOpen(false);
          }}
          onRetry={onRetry}
        />
      )}
      <Box display="none">
        <ReCAPTCHA
          ref={ref}
          size="invisible"
          sitekey={getReCaptchaKey() as string}
        />
      </Box>
    </PageContainer>
  );
}
