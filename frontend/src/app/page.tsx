import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.icon}>
          <span className="material-symbols-outlined" style={{ fontSize: 28 }}>
            link
          </span>
        </div>
        <h1 className={styles.title}>Link de agendamento necessário</h1>
        <p className={styles.text}>
          Para marcar um horário, peça o link de agendamento ao salão desejado.
        </p>
      </div>
    </div>
  );
}
