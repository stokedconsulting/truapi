"use client";

import styles from "./Pay.module.scss"
import Image from "next/image"
import { useBatchTransferAsset } from "@/hooks/useBatchTransferAsset"
import { BatchTransferItem } from "@/types/api.types"
import { useEffect, useRef, useState } from "react"
import { toast } from "react-toastify"
import Papa from "papaparse"
import { useAppUser } from "@/contexts/user.context"
import MinusCircleIcon from "@/public/assets/icons/minus-circle.svg"
import FailIcon from "@/public/assets/icons/fail.svg"
import { shortAddress } from "@/lib/utils"
import { isAddress } from "viem/utils";

// @todo - Token config
const selectedToken = {
    name: "USDC",
    symbol: "$USDC",
    address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
}

const maxRows = 5;

export default function Page() {
    const [step, setStep] = useState(0);
    const [rows, setRows] = useState<BatchTransferItem[]>([{ asset: 'usdc', destination: '', amount: '' }]);
    const [total, setTotal] = useState(0);
    const [file, setFile] = useState<File>();
    // const [selectedToken, setSelectedToken] = useState(tokens[0]);

    const uploadCsvRef = useRef<HTMLInputElement>(null);

    // const { addressedRows, isError: isEnsError } = useEnsLookup(rows);

    const { balances } = useAppUser();
    const { mutate: batchPayout, data: batchPayoutData, isPending, isSuccess, reset } = useBatchTransferAsset(rows);

    const handleInputChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        const newRows = [...rows];
        newRows[index][name as keyof BatchTransferItem] = value;
        setRows(newRows);
    };

    const handleSubmit = (e: React.FormEvent) => {
        try {
            e.preventDefault();

            if (step == 0) {
                setStep(1);
            }
            else if (step == 1) {
                batchPayout();
            }

        } catch (err) {
            toast.error("Something went wrong!")
        }
    }

    const handleCancel = (e: React.FormEvent) => {
        try {
            e.preventDefault();
            if (step == 1) {
                setStep(0);
            }
            else if (step == 2) {
                setStep(0);
                reset();
                setRows([{ asset: 'usdc', destination: '', amount: '' }]);
            }
        } catch (err) {
            toast.error("Something went wrong!")
        }
    }

    const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files)
            setFile(e.target.files[0]);
    }

    const handleCsvDownload = () => {
        try {
            const csvString = Papa.unparse(rows, {
                header: true,
            });
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', 'data.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error("Failed to download: ", err);
            toast.error("Failed to download CSV!");
        }
    }

    // const handleTokenSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    //     setSelectedToken(tokens[Number(e.target.value)]);
    // }

    const addRow = () => {
        if (rows.length <= maxRows)
            setRows([...rows, { asset: 'usdc', destination: '', amount: '' }]);
        else
            toast.error("Too many rows!");
    };

    const removeRow = (index: number) => {
        const newRows = [...rows];
        newRows.splice(index, 1);
        setRows(newRows);
    }

    // Parse and set CSV
    useEffect(() => {
        if (file)
            Papa.parse(file, {
                header: false,
                skipEmptyLines: true,
                complete: (results) => {
                    const parsedRows = results.data.map((row: any) => ({
                        asset: 'usdc',
                        destination: row[0],
                        amount: row[1],
                    })).slice(0, maxRows);
                    setRows(parsedRows);
                },
            });
    }, [file])

    // Calculate total amount when row is updated
    useEffect(() => {
        const _total = rows.reduce((sum, row) => sum + Number(row.amount), 0);
        setTotal(_total);
    }, [rows])

    // Track payout transaction
    useEffect(() => {
        console.log("data: ", batchPayoutData);
        if (!isPending && isSuccess) {
            toast.success("Payout successful!");
            setStep(2);
        }
    }, [isPending, isSuccess]);

    return (
        <div className={styles.main}>
            <div className={styles.formContainer}>
                {/* INSTRUCTIONAL HEADER */}
                <>
                    {/* STEP - 0 */}
                    {step == 0 &&
                        <div className={styles.header}>
                            <span>Enter Recipients & Amounts</span>
                        </div>}
                    {/* STEP - 1 */}
                    {step == 1 &&
                        <div className={styles.header}>
                            <h2>Review & Confirm Payout Amounts</h2>
                        </div>}
                    {/* STEP - 2 */}
                    {step == 2 &&
                        <div className={styles.header}>
                            <h2>Payouts Confirmed</h2>
                        </div>}
                </>
                {/* BALANCE */}
                <div className={styles.balanceContainer}>
                    <span className={styles.key}>Wallet Balance: </span>
                    <span className={styles.value}>{balances?.usdc || 0} USDC</span>
                </div>
                {/* HEADING */}
                <h3>Pay to</h3>
                <form className={styles.formRows} onSubmit={handleSubmit} onReset={handleCancel}>
                    <table className={styles.formTable}>
                        <tr>
                            <th>Recipient</th>
                            <th>{selectedToken.symbol}</th>
                        </tr>
                        {rows.map((row, index) => {
                            return (<tr>
                                {/* RECIPIENT */}
                                <td>
                                    {step == 0 && <div className={styles.inputContainer}>
                                        <input
                                            type="text"
                                            name="destination"
                                            placeholder="ENS/0xAddress"
                                            value={row.destination}
                                            required
                                            onChange={(e) => handleInputChange(index, e)}
                                        />
                                    </div>}
                                    {(step == 1 || step == 2) &&
                                        <div
                                            className={styles.inputContainer + " " + styles.explorer}
                                            style={(batchPayoutData?.transferStatus[index].status === "failed") ? { "color": "red" } : {}}
                                        >
                                            {step === 2 && batchPayoutData?.transferStatus
                                                ? (batchPayoutData.transferStatus[index].status === "failed"
                                                    ? <FailIcon />
                                                    : (<a href={batchPayoutData.transferStatus[index].transactionLink} target="_blank" rel="noopener noreferrer">
                                                        <Image src={"/assets/basescan-logo.png"} width={24} height={24} alt={"basescan"} />
                                                    </a>))
                                                : null}
                                            {(step == 1 || step == 2) &&
                                                isAddress(rows[index].destination) ? shortAddress(rows[index].destination, 10) : rows[index].destination
                                            }
                                        </div>}
                                </td>
                                {/* AMOUNT */}
                                <td>
                                    <div className={styles.amountCell}>
                                        {step == 0 && <div className={styles.inputContainer}>
                                            <input
                                                type="number"
                                                name="amount"
                                                placeholder="Amount"
                                                value={row.amount}
                                                required
                                                onChange={(e) => handleInputChange(index, e)}
                                            />
                                        </div>}
                                        {(step == 1 || step == 2) && <div className={styles.inputContainer}>
                                            <span
                                                className={`${styles.amounts} ${step == 1 ? styles.confirmed : styles.success}`}
                                                style={batchPayoutData?.transferStatus[index].status === "failed" ? { "color": "red" } : {}}
                                            >
                                                {row.amount}
                                            </span>
                                        </div>}

                                        {(step == 0 && index > 0) &&
                                            <button type="button" className={`${styles.addBttn}`} onClick={() => removeRow(index)}>
                                                <MinusCircleIcon />
                                            </button>}
                                    </div>
                                </td>
                            </tr>)
                        })}
                    </table>
                    {(step == 1 || step == 2) &&
                        <div className={styles.row}>
                            <h2>Total Payments:</h2>
                            <h2 className={`${styles.amounts} ${step == 1 ? styles.confirmed : styles.success}`}>{total.toLocaleString()} {selectedToken.symbol}</h2>
                        </div>
                    }
                    <div className={styles.rowActions}>
                        {(step == 0 && rows.length < maxRows) &&
                            <button type="button" className={`${styles.addBttn}`} onClick={addRow}>
                                {/* <img src={addIcon} alt="Add" /> */}
                                + Add
                            </button>}
                    </div>
                    {(step == 0) &&
                        <>
                            <div className={styles.divider}>
                                <div className={styles.hr} />
                                <span>OR</span>
                                <div className={styles.hr} />
                            </div>
                            <>
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleCsvUpload}
                                    className={styles.secondaryBttn}
                                    style={{ display: 'none' }}
                                    ref={uploadCsvRef}
                                />
                                <button className={styles.secondaryBttn} onClick={() => {
                                    uploadCsvRef.current?.click();
                                }}>
                                    {file ? file.name : "Upload CSV File"}
                                </button>
                            </>
                        </>
                    }
                    {(step == 0 || step == 1) &&
                        <button type="submit" disabled={isPending} className={`${styles.primaryBttn}`}>
                            {isPending &&
                                // <img src={coinbaseLoading} alt="loading" />
                                "Loading"
                            }
                            {(step == 0 && !isPending) && "Next"}
                            {(step == 1 && !isPending) && "Confirm"}
                        </button>}
                    {/* {isEnsError && <span className={styles.errorMsg}>ENS Lookup Failed</span>} */}
                    {step == 2 &&
                        <button className={styles.secondaryBttn} onClick={handleCsvDownload}>
                            Download CSV
                        </button>}
                    {(step == 1 || step == 2) &&
                        <button type="reset" disabled={isPending} className={styles.secondaryBttn}>
                            {step == 1 && "Cancel"}
                            {step == 2 && "Restart"}
                        </button>}
                </form>
            </div>
        </div>
    );

}