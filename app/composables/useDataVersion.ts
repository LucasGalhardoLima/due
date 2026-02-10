export const useDataVersion = () => {
  const dataVersion = useState('dataVersion', () => 0)

  const bumpDataVersion = () => {
    dataVersion.value += 1
  }

  return {
    dataVersion,
    bumpDataVersion
  }
}
