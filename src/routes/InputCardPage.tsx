import { Box } from "@mui/material";
import React from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { useNavigate } from "react-router-dom";
import ErrorModal from "../components/modals/ErrorModal";
import PageContainer from "../components/PageContent/PageContainer";
import { InputCardForm } from "../features/payment/components/InputCardForm/InputCardForm";
import {
  InputCardFormFields,
  PspList,
} from "../features/payment/models/paymentModel";
import { useAppDispatch } from "../redux/hooks/hooks";
import { setCardData } from "../redux/slices/cardData";
import { setSecurityCode } from "../redux/slices/securityCode";
import {
  getPaymentMethod,
  getPaymentId,
  getReCaptchaKey,
  getTransaction,
  setPspSelected,
} from "../utils/api/apiService";
import {
  activatePayment,
  getPaymentPSPList,
  onErrorGetPSP,
  sortPspByOnUsPolicy,
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
  const [wallet] = React.useState<InputCardFormFields>();
  const [hideCancelButton, setHideCancelButton] = React.useState(false);
  const ref = React.useRef<ReCAPTCHA>(null);
  const config = getConfigOrThrow();
  const dispatch = useAppDispatch();

  React.useEffect(() => {
    setHideCancelButton(!!getTransaction().transactionId);
  }, []);

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

  const onResponse = () => {
    setLoading(false);
    navigate(`/${CheckoutRoutes.RIEPILOGO_PAGAMENTO}`);
  };

  const onSubmit = React.useCallback(
    async (wallet: InputCardFormFields) => {
      const cardData = {
        brand: "",
        expDate: wallet.expirationDate,
        cardHolderName: wallet.name,
        cvv: wallet.cvv,
        pan: wallet.number,
      };
      dispatch(setCardData(cardData));
      dispatch(setSecurityCode(cardData.cvv));
      setLoading(true);
      await getPaymentPSPList({
        paymentMethodId: getPaymentMethod()?.paymentMethodId,
        onError: onErrorGetPSP,
        onResponse: (resp: Array<PspList>) => {
          const firstPsp = sortPspByOnUsPolicy(resp);
          setPspSelected({
            pspCode: firstPsp.at(0)?.idPsp || "",
            fee: firstPsp.at(0)?.commission || 0,
            businessName: firstPsp.at(0)?.name || "",
          });
        },
      });
      const paymentId = getPaymentId().paymentId;
      const transactionId = getTransaction().transactionId;
      // If I want to change the card data but I have already activated the payment
      if (paymentId && transactionId) {
        onResponse();
      } else {
        await activatePayment({
          onResponse,
          onError,
          onNavigate: () => navigate(`/${CheckoutRoutes.ERRORE}`),
        });
      }
    },
    [ref, error]
  );

  const onRetry = React.useCallback(() => {
    setErrorModalOpen(false);
    void onSubmit(wallet as InputCardFormFields);
  }, [wallet, error]);

  const onCancel = () => navigate(-1);
  return (
    <PageContainer title="inputCardPage.title">
      <Box sx={{ mt: 6 }}>
        <InputCardForm
          onCancel={onCancel}
          onSubmit={onSubmit}
          hideCancel={hideCancelButton}
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
