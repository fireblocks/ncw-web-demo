import React from "react";

import { TMPCAlgorithm, TKeyStatus } from "@fireblocks/ncw-js-sdk";
import { useAppStore } from "../AppStore";
import { Card, ICardAction } from "./ui/Card";

const getDefaultAlgorithems = (): Set<TMPCAlgorithm> => {
  const algorithms = new Set<TMPCAlgorithm>();
  algorithms.add("MPC_CMP_ECDSA_SECP256K1");
  //   algorithms.add("MPC_EDDSA_ED25519");
  return algorithms;
};

export const GenerateMPCKeys: React.FC = () => {
  const [err, setErr] = React.useState<string | null>(null);
  const [isGenerateInProgress, setIsGenerateInProgress] = React.useState(false);
  const [isStopInProgress, setIsStopInProgress] = React.useState(false);
  const [generateMPCKeysResult, setGenerateMPCKeysResult] = React.useState<string | null>(null);
  const [algorithms, setAlgorithms] = React.useState<Set<TMPCAlgorithm>>(getDefaultAlgorithems);
  const { fireblocksNCW, keysStatus } = useAppStore();

  if (!fireblocksNCW) {
    return null;
  }

  const doGenerateMPCKeys = async () => {
    setGenerateMPCKeysResult(null);
    setErr(null);
    setIsGenerateInProgress(true);
    try {
      await fireblocksNCW.generateMPCKeys(algorithms);
      setGenerateMPCKeysResult(generateMPCKeysResult);
      setIsGenerateInProgress(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErr(err.message);
      } else {
        if (typeof err === "string") {
          setErr(err);
        } else {
          setErr("Unknown Error");
        }
      }
    } finally {
      setIsGenerateInProgress(false);
    }
  };

  const doStopMPCDeviceSetup = async () => {
    setErr(null);
    setIsStopInProgress(true);
    try {
      await fireblocksNCW.stopMpcDeviceSetup();
      setIsStopInProgress(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErr(err.message);
      } else {
        setErr("Unknown Error");
      }
    } finally {
      setIsStopInProgress(false);
    }
  };

  const algoSECP256K1Selected = algorithms.has("MPC_CMP_ECDSA_SECP256K1");
  const algoED25519Selected = algorithms.has("MPC_EDDSA_ED25519");
  const algoSelected = algoSECP256K1Selected || algoED25519Selected;

  const toggleAlgo = (algo: TMPCAlgorithm) => {
    if (algorithms.has(algo)) {
      algorithms.delete(algo);
      setAlgorithms(new Set(algorithms));
    } else {
      algorithms.add(algo);
      setAlgorithms(new Set(algorithms));
    }
  };

  const secP256K1Status = keysStatus?.MPC_CMP_ECDSA_SECP256K1?.keyStatus ?? null;
  const ed25519Status = keysStatus?.MPC_EDDSA_ED25519?.keyStatus ?? null;
  const statusToProgress = (status: TKeyStatus | null) => {
    switch (status) {
      case "INITIATED":
        return 7;
      case "REQUESTED_SETUP":
        return 32;
      case "SETUP":
        return 53;
      case "SETUP_COMPLETE":
        return 72;
      case "READY":
        return 100;
      default:
        return 0;
    }
  };

  const generateAction: ICardAction = {
    label: "Generate MPC Keys",
    action: doGenerateMPCKeys,
    isDisabled: isGenerateInProgress || !algoSelected,
    isInProgress: isGenerateInProgress,
  };

  const stopAction: ICardAction = {
    label: "Stop MPC Device Setup",
    action: doStopMPCDeviceSetup,
    isDisabled: isStopInProgress || !isGenerateInProgress,
    isInProgress: isStopInProgress,
  };

  const showEDDSA = false;
  return (
    <Card title="Generate MPC Keys" actions={[generateAction, stopAction]}>
      <div className="overflow-x-auto">
        <table className="table">
          {/* head */}
          <thead>
            <tr>
              <th>Algorithm</th>
              <th>INITIATED</th>
              <th>REQUESTED_SETUP</th>
              <th>SETUP</th>
              <th>SETUP_COMPLETE</th>
              <th>READY</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>
                <div className="grid grid-cols-[150px_150px] gap-2">
                  <label className="cursor-pointer label">
                    <span className="label-text">ECDSA SECP256K1</span>
                  </label>
                  {/* <input
                    type="checkbox"
                    className="toggle toggle-info self-center"
                    checked={algoSECP256K1Selected}
                    onChange={() => toggleAlgo("MPC_CMP_ECDSA_SECP256K1")}
                  /> */}
                </div>
              </th>
              <td colSpan={5}>
                <progress
                  className="progress progress-primary"
                  value={statusToProgress(secP256K1Status)}
                  max="100"
                ></progress>
              </td>
            </tr>
            {showEDDSA && (
              <tr>
                <th>
                  <div className="grid grid-cols-[150px_150px] gap-2">
                    <label className="cursor-pointer label">
                      <span className="label-text">EDDSA ED25519</span>
                    </label>
                    <input
                      type="checkbox"
                      className="toggle toggle-info self-center"
                      disabled
                      checked={algoED25519Selected}
                      onChange={() => toggleAlgo("MPC_EDDSA_ED25519")}
                    />
                  </div>
                </th>
                <td colSpan={5}>
                  <progress
                    className="progress progress-primary"
                    value={statusToProgress(ed25519Status)}
                    max="100"
                  ></progress>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {generateMPCKeysResult && (
        <div className="mockup-code">
          <pre>
            <code>Result: {generateMPCKeysResult}</code>
          </pre>
        </div>
      )}
      {err && (
        <div className="alert alert-error shadow-lg">
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current flex-shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{err}</span>
          </div>
        </div>
      )}
    </Card>
  );
};
